const mongoose = require('mongoose');

const weeklySchema = new mongoose.Schema({
  day: { type: String, required: true }, // Nom du jour (ex: Lundi, Mardi)
  date: { type: Date, required: true },  // Date du jour
  averageTemperature: { type: Number, required: true }, // Température moyenne
  averageHumidity: { type: Number, required: true },    // Humidité moyenne
});

module.exports = mongoose.model('Weekly', weeklySchema);
