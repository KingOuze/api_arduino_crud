const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/yakkar', { useUnifiedTopology: true });

// Définir le schéma pour la collection "mesures"
const mesuresSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    date: { type: Date, default: Date.now }
});

//Methode pour calculer la moyenne de la temperature de la semaine
mesuresSchema.statics.calculateDailyAverage = async function (date) {
    // Calculer la moyenne des températures pour une journée spécifique
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0); // Début de la journée à minuit
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999); // Fin de la journée à 23:59:59
  
    const temperatures = await this.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
  
    if (temperatures.length === 0) {
      return null; // Pas de données collectées pour ce jour-là
    }
  
    const sum = temperatures.reduce((acc, temp) => acc + temp.temperature, 0);
    const average = sum / temperatures.length;
    return average;
  };
// Créer le modèle pour la collection "mesures"
const Mesure = mongoose.model('Mesure', mesuresSchema);


module.exports = Mesure; // Assurez-vous d'exporter le modèle Mesure