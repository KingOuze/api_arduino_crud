const WebSocket = require('ws');
const {SerialPort} = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Configuration du port série pour lire les données de l'Arduino
const port = new SerialPort({
  path: '/dev/ttyUSB0',
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
