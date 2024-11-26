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
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  console.log('Client connecté');

  // Envoi d'un message de bienvenue au client
  ws.send(JSON.stringify({ message: 'Connexion établie' }));

  // Gestion des messages envoyés par le client (si nécessaire)
  ws.on('message', message => {
    console.log('Message reçu du client:', message);
  });

  // Lorsque le client se déconnecte
  ws.on('close', () => {
    console.log('Client déconnecté');
  });
});

// Lire les données du port série et les transmettre aux clients WebSocket
parser.on('data', line => {
  try {
    const jsonData = JSON.parse(line); // Parser les données JSON envoyées par l'Arduino
    console.log('Données reçues de l\'Arduino:', jsonData);

    // En fonction du type de données, envoyer à tous les clients connectés
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        if (jsonData.type === 'sensor') {
          // Envoi des données de capteur (température et humidité)
          client.send(JSON.stringify({
            type: 'sensor',
            temperature: jsonData.temperature,
            humidity: jsonData.humidity
          }));
        } else if (jsonData.type === 'keypad') {
          console.log(JSON.stringify(jsonData.value));
          // Envoi des données du clavier (touche pressée)
          client.send(JSON.stringify({
            type: 'keypad',
            value: jsonData.value
          }));
        }
      }
    });
  } catch (err) {
    console.error('Erreur de parsing JSON:', err);
  }
});


console.log('Serveur WebSocket en écoute sur ws://localhost:8080');
