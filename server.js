require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connect } = require('./db/connect');
const routerUser = require('./router/route');

// App initialization
const app = express();
const PORT = process.env.EXPRESS_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// API Routes
app.use('/api', routerUser);
app.get('/api/test', (req, res) => res.json({ msg: 'CORS fonctionne correctement' }));

// Database Connection
connect(process.env.MONGO_URI, (err) => {
  if (err) {
    console.error("Erreur lors de la connexion à la base de données MongoDB:", err);
    process.exit(-1); // Arrêt du programme en cas d'erreur de connexion
  } else {
    console.log("Connexion à MongoDB réussie");


  }
});

/*// WebSocket Setup
const wss = new WebSocket.Server({ port: 8080 });
const wssKey = new WebSocket.Server({ port: 8000 });

wss.on('connection', (ws) => console.log('Client WebSocket connecté'));
wssKey.on('connection', (ws) => console.log('Client WebSocket Keypad connecté'));

// SerialPort Setup
const serialPort = new SerialPort({
  path: process.env.SERIAL_PORT || '/dev/ttyUSB0',
  baudRate: 9600,
});
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

// Serial Data Handling
parser.on('data', (data) => {
  const parsedData = parseArduinoData(data);
  if (parsedData) handleParsedData(parsedData);
});

// Parse Arduino Data
function parseArduinoData(data) {
  try {
    if (data.startsWith('TEMP')) {
      const match = data.match(/TEMP:(\d+(\.\d+)?),HUM:(\d+(\.\d+)?)/);
      if (match) return { type: 'sensor', temperature: parseFloat(match[1]), humidity: parseFloat(match[3]) };
    } else if (data.startsWith('KEY:')) {
      const match = data.match(/KEY:(.)/);
      if (match) return { type: 'keypad', key: match[1] };
    }
  } catch (err) {
    console.error('Erreur d’analyse des données:', err);
  }
  return null;
}

// Handle Parsed Data
function handleParsedData(parsedData) {
  if (parsedData.type === 'sensor') {
    console.log(`Température : ${parsedData.temperature}°C, Humidité : ${parsedData.humidity}%`);
    broadcastToClients(wss, { temperature: parsedData.temperature, humidity: parsedData.humidity });
  } else if (parsedData.type === 'keypad') {
    console.log(`Touche du keypad pressée : ${parsedData.key}`);
    broadcastToClients(wssKey, { keypadCode: parsedData.key });
  }
}

// Broadcast Data to WebSocket Clients
function broadcastToClients(wss, data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}


// Ventilation Control
let fanState = false;
function controlVentilation(state) {
  const command = state ? 'VENT:ON' : 'VENT:OFF';
  serialPort.write(`${command}\n`, (err) => {
    if (err) {
      console.error('Erreur lors de l’écriture sur le port série:', err);
    } else {
      fanState = state;
      console.log(`Commande envoyée : ${command}`);
    }
  });
}*/


// Start Express Server
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));