/*const express = require('express');
const WebSocket = require('ws');
const {SerialPort} = require('serialport');
const {Readline} = require('@serialport/parser-readline');

// Configuration de la connexion sériecron.schedule('0,1,2 18 * * *', () => {
  console.log('Enregistrement des données à', new Date());
  saveData(); // Fonction que vous avez déjà pour enregistrer les mesures
});


app.get('/api/mesures/specific-times', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Début du jour actuel

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Début du jour suivant

    const mesures = await MesureModel.find({
      timestamp: { $gte: today, $lt: tomorrow },
    }).sort({ timestamp: 1 });

    // Filtrer les mesures pour obtenir celles à 18h00, 18h01 et 18h02
    const fixedTimes = [
      { hour: 18, minute: 0 },
      { hour: 18, minute: 1 },
      { hour: 18, minute: 2 },
    ];

    const filteredMesures = fixedTimes.map(time => {
      return mesures.find(mesure => {
        const mesureDate = new Date(mesure.timestamp);
        return (
          mesureDate.getHours() === time.hour &&
          mesureDate.getMinutes() === time.minute
        );
      });
    }).filter(Boolean); // Retirer les valeurs undefined si aucune mesure n'existe pour une heure donnée

    const response = filteredMesures.map(mesure => ({
      temperature: mesure.temperature,
      humidity: mesure.humidity,
      timestamp: mesure.timestamp,
    }));

    res.json({
      message: 'Mesures récupérées avec succès',
      data: response,
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des données:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

const port = new SerialPort({ 
  patch: '/dev/ttyUSB0',
  baudRate: 9600 });
const parser = port.pipe(new Readline({ delimiter: '\n' }));

// Serveur WebSocket
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  console.log('Client connecté');
  ws.on('message', message => {
    console.log('Message reçu du client:', message);
  });

  // Lorsque le client se déconnecte
  ws.on('close', () => {
    console.log('Client déconnecté');
  });
});

// Lire les données de l'Arduino et les transmettre via WebSocket
parser.on('data', line => {
  console.log('Donnée reçue de l\'Arduino:', line);
  
  // Envoyer les données aux clients WebSocket connectés
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(line);  // Envoie les données en JSON à tous les clients
    }
  });
});

console.log('Serveur WebSocket en écoute sur ws://localhost:8080');
*/


const WebSocket = require('ws');
const {SerialPort} = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cron = require('node-cron');
const Mesure = require('./models/Mesure');
const Config = require('./models/Config');


// Configuration du port série pour lire les données de l'Arduino
const port = new SerialPort({
  path: '/dev/ttyACM0',
  baudRate: 9600 
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Création du serveur WebSocket
const wss = new WebSocket.Server({ port: 8080 });

let latestData = null;
let isSaving = false;

wss.on('connection', ws => {
  console.log('Client connecté');


ws.send(JSON.stringify({ message: 'Connexion établie' }));


// Gestion des messages envoyés par le client (si nécessaire)
ws.on('message', message => {
  if (Buffer.isBuffer(message)) {
    message = message.toString();
  }

  console.log('Message reçu du client:', message);

  // Assurez-vous que `message` est bien un booléen
  if (message === 'true') {
    port.write('FAN_ON\n', (err) => {
      if (err) {
        console.error('Erreur lors de l’écriture sur le port série:', err);
      } else {
        console.log('Commande envoyée : FAN_ON');
      }
    });
  } else if (message === 'false') {
      port.write('FAN_OFF\n', (err) => {
        if (err) {
          console.error('Erreur lors de l’écriture sur le port série:', err);
        } else {
          console.log('Commande envoyée : FAN_OFF');
        }
      });
    } else {
      console.log('Message invalide reçu:', message);
    }

})




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

 latestData = jsonData;
  // En fonction du type de données, envoyer à tous les clients connectés
  /*wss.clients.forEach(client => {
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
  });*/

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {

        // Envoi des données de capteur (température et humidité)
        client.send(JSON.stringify({
          type: 'sensor',
          temperature: jsonData.temperature,
          humidity: jsonData.humidity
        }));
      }
    
  });

 
}
catch (err) {
  console.error('Erreur lors de la conversion du JSON:', err);
}



});


async function saveData() {
if (isSaving) {
  console.log('Enregistrement déjà en cours, en attente...');
  return; // Ignore si une tâche est déjà en cours
}

isSaving = true; // Marque l'état comme "en cours"

try {
  if (latestData && latestData.temperature !== null && latestData.humidity !== null) {
    const mesure = new Mesure({
      temperature: latestData.temperature,
      humidity: latestData.humidity
    });

    await mesure.save();
    console.log('Données enregistrées avec succès');
  } else {
    console.error('Données invalides ou inexistantes');
  }
} catch (err) {
  console.error('Erreur lors de l\'enregistrement des données:', err.message);
} finally {
  isSaving = false; // Réinitialise le verrou une fois terminé
}
}


async function configureCronJobs() {
try {
  const config = await Config.findOne();

  if (config) {
    const { hours, minutes } = config;

    // Supprimez les doublons dans les heures et minutes
    const uniqueHours = [...new Set(hours)];
    const uniqueMinutes = [...new Set(minutes)];

    // Arrêtez toutes les tâches cron existantes avant de reconfigurer
    cron.getTasks().forEach((task) => task.stop());

    uniqueHours.forEach((hour) => {
      uniqueMinutes.forEach((minute) => {
        const cronExpression = `${minute} ${hour} * * *`;
        
        // Créez une tâche cron pour chaque combinaison unique
        cron.schedule(cronExpression, () => {
          console.log(`Enregistrement des données à ${hour}:${minute}`);
          saveData(); // Appel de la fonction d'enregistrement
        });
      });
    });

    console.log('Les tâches cron ont été reconfigurées avec succès.');
  } else {
    console.error('Aucune configuration trouvée dans la base de données.');
  }
} catch (err) {
  console.error('Erreur lors de la reconfiguration des tâches cron:', err);
}
}


configureCronJobs();






parser.on('control_fan', () => {
const command = state ? 'FAN_OFF' : 'FAN_ON';
SerialPort.write(`${command}\n`, (err) => {
    if (err) {
      console.error('Erreur lors de l’écriture sur le port série:', err);
    } else {
      fanState = state;
      console.log(`Commande envoyée : ${command}`);
    }
});
});


console.log('Serveur WebSocket en écoute sur ws://localhost:8080');