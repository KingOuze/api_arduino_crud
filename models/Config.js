// models/Config.js
const mongoose = require('mongoose');

// Schéma de la configuration des heures et minutes
const configSchema = new mongoose.Schema({
  hours: {
    type: [Number],
    required: true
  },
  minutes: {
    type: [Number],
    required: true
  }
});

// Création du modèle Config
const Config = mongoose.model('Config', configSchema);

module.exports = Config;