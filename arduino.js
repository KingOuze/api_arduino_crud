// server.js
const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');

// Configuration
const PORT = 4000;
const SERIAL_PORT = '/dev/ttyUSB0'; // Adjust based on your Arduino's port
const BAUD_RATE = 9600;

// Initialisation
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());

// Communication avec l'Arduino
const serialPort = new SerialPort({ 
    path: SERIAL_PORT,
    baudRate: BAUD_RATE 
});
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Gestion des données Arduino
parser.on('data', (data) => {
    try {
        const parsedData = JSON.parse(data);
        console.log('Données Arduino:', parsedData);

        // Identify data type (keypad or sensor) and emit events
        if (parsedData.type === 'keypad') {
            io.emit('keypad-data', parsedData.value); // Send keypad data to frontend
        } else if (parsedData.type === 'sensor') {
            io.emit('sensor-data', { 
                temperature: parsedData.temperature, 
                humidity: parsedData.humidity 
            }); // Send temperature and humidity to frontend
        }
    } catch (err) {
        console.error('Erreur de parsing:', err);
    }
});

// Gestion des commandes du frontend
io.on('connection', (socket) => {
    console.log('Client connecté');

    socket.on('fan-control', (command) => {
        console.log('Commande reçue:', command);

        // Commande à envoyer à l'Arduino
        if (command === 'on') {
            serialPort.write('1');
        } else if (command === 'off') {
            serialPort.write('0');
        }
    });
});

// Lancement du serveur
server.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
