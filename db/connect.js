const { MongoClient } = require("mongodb");

let client = null;

// Connexion à MongoDB
function connect(url, callback) {
  if (client === null) {
    client = new MongoClient(url);

    client.connect((err) => {
      if (err) {
        client = null;
        callback(err);
      } else {
        callback(); // Connexion réussie
      }
    });
  } else {
    callback(); // Connexion déjà établie
  }
}

// Retourne la base de données "yakkar"
function db() {
  if (!client) {
    throw new Error('MongoDB client is not connected.');
  }
  return client.db("yakkar");
}

// Ferme la connexion MongoDB
function fermer() {
  if (client) {
    client.close();
    client = null;
  }
}

module.exports = { connect, client, db, fermer };



/*

//WebSocket : se connecter au serveur WebSocket
const WebSocket = require("ws"); // Assurez-vous d'avoir installé le package ws via npm

let wsClient = null;

function connectWebSocket(url, callback) {
  if (wsClient === null) {
    wsClient = new WebSocket(url);

    wsClient.on('open', function() {
      console.log('Connexion établie avec le serveur WebSocket');
      callback(true);
    });

    wsClient.on('error', function(error) {
      console.error('Erreur de connexion WebSocket :', error);
      callback(false);
    });

    wsClient.on('close', function() {
      console.log('Connexion fermée');
      wsClient = null;
      callback(false);
    });
  }
}

module.exports = { connectWebSocket };*/
