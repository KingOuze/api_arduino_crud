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

const WebSocket = require('ws');
const {SerialPort} = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Configuration du port série pour lire les données de l'Arduino
const port = new SerialPort({
  path: '/dev/ttyACM1',
  baudRate: 9600 
});
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Création du serveur WebSocket
const wss = new WebSocket.Server({ port: 8000 });

wss.on('connection', ws => {
  console.log('Client connecté');

  // Envoi d'un message de bienvenue au client
  ws.send(JSON.stringify({ message: 'Connexion établie' }));




  // Lorsque le client se déconnecte
  ws.on('close', () => {
    console.log('Client déconnecté');
  });


 
});

 // Lire les données du port série et les transmettre aux clients WebSocket
 parser.on('data', line => {
    try {
      const jsonData = line; // Parser les données JSON envoyées par l'Arduino
      console.log('Données reçues de l\'Arduino:', jsonData);
          // Envoi des données du clavier (touche pressée)
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {  // Vérifier si le client est connecté
              client.send(JSON.stringify({
                type: 'keypad',
                value: jsonData
              }
            ));
         
            }
          });
        
      } catch (e) {
          console.error('Erreur lors du parsing des données JSON:', e);
      }
  })
  

console.log('Serveur WebSocket en écoute sur ws://localhost:8000');



// Start Express Server
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));