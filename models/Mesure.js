const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/yakkar', { useUnifiedTopology: true });

// Définir le schéma pour la collection "mesures"
const mesuresSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    date: { type: Date, default: Date.now }
});

// Créer le modèle pour la collection "mesures"
const Mesure = mongoose.model('Mesure', mesuresSchema);


module.exports = Mesure; // Assurez-vous d'exporter le modèle Mesure