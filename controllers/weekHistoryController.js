const Mesure = require('../models/Mesure'); // Importez votre modèle Mesure

// Calculer le début et la fin de la semaine en cours
const getWeekDateRange = () => {
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay();

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - dayOfWeek + 1); // Revenir au lundi
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

// Organiser les données de la semaine par jour
const organizeWeeklyData = (temperatures, startOfWeek) => {
  const weeklyData = [];

  for (let i = 0; i <= 6; i++) {
    const dayStart = new Date(startOfWeek);
    dayStart.setDate(startOfWeek.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    // Filtrer les températures pour ce jour
    const dailyTemps = temperatures.filter(temp => {
      const tempDate = new Date(temp.date); // Convertir en date si nécessaire
      return tempDate >= dayStart && tempDate <= dayEnd;
    });

    // Calculer les moyennes journalières
    const dailyAvgTemp = dailyTemps.reduce((acc, temp) => acc + temp.temperature, 0) / dailyTemps.length || 0;
    const dailyAvgHumidity = dailyTemps.reduce((acc, temp) => acc + temp.humidity, 0) / dailyTemps.length || 0;

    weeklyData.push({
      day: dayStart.toLocaleString('fr-FR', { weekday: 'long' }), // Jour (Lundi, Mardi, ...)
      date: dayStart,
      averageTemperature: dailyAvgTemp,
      averageHumidity: dailyAvgHumidity,
    });
  }

  return weeklyData;
};

// Contrôleur pour récupérer les données hebdomadaires
const getWeekHistory = async (req, res) => {
  try {
    const { startOfWeek, endOfWeek } = getWeekDateRange();

    console.log('Début de la semaine :', startOfWeek);
    console.log('Fin de la semaine :', endOfWeek);

    // Récupérer les données dans la base
    const temperatures = await Mesure.find({
      date: { $gte: startOfWeek, $lte: endOfWeek },
    });

    if (!temperatures || temperatures.length === 0) {
      return res.status(404).json({ message: 'Aucune donnée disponible pour cette semaine.' });
    }

    // Organiser les données
    const weeklyData = organizeWeeklyData(temperatures, startOfWeek);

    res.json({ weeklyData });
  } catch (error) {
    console.error('Erreur lors de la récupération des données hebdomadaires :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getWeekHistory,
};
