const express = require("express");
const client = require("../db/connect");
const { ObjectId } = require('mongodb');
const Weekly = require('../models/weekly'); // Modèle Weekly

const {
  storeUser,
  getAllUsers,
  findUser,
  updateUser,
  deleteUser,
  desarchivedUser,
  listArchived
} = require("../controllers/UserController");

const {
  loginUser
} = require("../controllers/AuthController");

const {
} = require("../controllers/MesureController");


const isAuthenticated = require("../middlewares/authMiddleware"); // Importation du middleware
const authorizeAdmin = require("../middlewares/authorized");
const Mesure = require("../models/Mesure");

const router = express.Router();

// Connexion des utilisateurs (pas besoin de middleware)
router.route("/auth/login").post(loginUser);

// Gestion des utilisateurs (ajout du middleware d'authentification)
router.route("/users").post(storeUser);
router.route("/users").get( getAllUsers);
router.route("/user/:id").get(findUser);
router.route("/user/:id").put(updateUser);
router.route("/user/:id/archived").delete(deleteUser);
router.route("/user/:id/unarchived").post(desarchivedUser);
router.route("/users/list-archived").get(listArchived);

// Route pour récupérer les enregistrements de la semaine courante
//router.get('/records', getWeeklyRecords);
//router.post('/records', isAuthenticated, authorizeAdmin, storeRecord);

// Route pour changer le rôle
router.put('/user/:id/switch-role', async (req, res) => {
    const userId = req.params.id;

    try {
        const usersCollection = client.db().collection('users'); // Remplacez par le nom de votre collection

        // Recherchez l'utilisateur par ID
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Basculer le rôle
        const newRole = user.role === 'user' ? 'admin' : 'user';

        // Mettre à jour le rôle
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { role: newRole } }
        );

        return res.status(200).json({ message: 'Rôle mis à jour avec succès', newRole });
    } catch (error) {
        console.error('Erreur lors du changement de rôle :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Route pour obtenir les relevés à des heures fixes
// Route pour obtenir les relevés à des heures fixes
router.get('/mesures/specific-times', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Début du jour actuel

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Début du jour suivant

    const mesures = await Mesure.find({
      date: { $gte: today, $lt: tomorrow },
    }).sort({ timestamp: 1 });
 
    console.log(mesures)
    // Horaires fixes à rechercher
    const fixedTimes = [
      { hour: 18, minute: 39 },
      { hour: 18, minute: 40 },
      { hour: 18, minute: 41 },
    ];

    // Associer chaque horaire à une mesure ou `null`
    const response = fixedTimes.map(({ hour, minute }) => {
      const mesure = mesures.find(mesure => {
        const mesureDate = new Date(mesure.date);
        return (
          mesureDate.getHours() === hour &&
          mesureDate.getMinutes() === minute
        );
      });
      return {
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        temperature: mesure ? mesure.temperature : null,
        humidity: mesure ? mesure.humidity : null,
      };
    });

    res.json({
      message: 'Mesures récupérées avec succès',
      data: response,
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des données:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});



//recupération des temperatures par rapport au date données
router.get('/average/:date', async (req, res) => {
  try {
    const dateParam = req.params.date;  // La date passée en paramètre sous le format YYYY-MM-DD

    // Utiliser la méthode statique `calculateDailyAverage` pour obtenir la moyenne des températures
    const averageTemperature = await Mesure.calculateDailyAverage(dateParam);

    if (averageTemperature === null) {
      return res.status(404).json({ message: 'Aucune donnée disponible pour cette date.' });
    }

    // Filtrer les températures pour la même date pour obtenir la moyenne de l'humidité également
    const startOfDay = new Date(dateParam);
    startOfDay.setHours(0, 0, 0, 0); // Début de la journée (minuit)
    
    const endOfDay = new Date(dateParam);  // Fin de la journée (23h59)
    endOfDay.setHours(23, 59, 59, 999);

    // Récupérer toutes les températures pour cette date afin de calculer l'humidité moyenne
    const temperatures = await Mesure.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const averageHumidity = temperatures.reduce((acc, temp) => acc + temp.humidity, 0) / temperatures.length;

    return res.status(200).json({
      date: dateParam,
      averageTemperature: averageTemperature,
      averageHumidity: averageHumidity
    });

  } catch (error) {
    console.error('Erreur lors du calcul de la moyenne :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});



 // Route pour lister l'historique des températures et humidités
 router.get('/temperatures/historique', async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // Récupérer les éventuels filtres

    let filter = {}; // Filtre vide par défaut
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Récupérer et trier les données
    const temperatures = await Mesure.find(filter).sort({ date: -1 });

    // Retourner les données sous forme de JSON
    res.status(200).json(temperatures);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique', error: error.message });
  }
});

router.get('/temperatures/historique-semaine', async (req, res) => {
  try {
    // Récupérer les données de la collection Weekly
    const weeklyData = await Weekly.find().sort({ date: 1 }); // Trier par date croissante (lundi -> dimanche)

    if (!weeklyData || weeklyData.length === 0) {
      return res.status(404).json({ message: 'Aucune donnée hebdomadaire disponible.' });
    }

    // Retourner les données organisées par jour
    res.status(200).json(weeklyData);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique hebdomadaire :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique hebdomadaire', error: error.message });
  }
});
// Route pour obtenir la température et l'humidité moyennes de la journée
router.get('/moyennes', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const mesures = await Mesure.find({
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(mesures);
    if (mesures.length === 0) {
      return res.json({
        message: 'Aucune mesure disponible pour aujourd\'hui.',
        averageTemperature: null,
        averageHumidity: null,
      });
    }
    const totalTemperature = mesures.reduce((sum, mesure) => sum + mesure.temperature, 0);
    const totalHumidity = mesures.reduce((sum, mesure) => sum + mesure.humidity, 0);

    const averageTemperature = totalTemperature / mesures.length;
    const averageHumidity = totalHumidity / mesures.length;
   res.json({
        message: 'Moyennes calculées avec succès',
        averageTemperature: averageTemperature,
        averageHumidity: averageHumidity,
      });
    } catch (err) {
      console.error('Erreur lors de la récupération des moyennes de la journée:', err);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }
  });


  

  
/**
 * Route pour la déconnexion de l'utilisateur
 */
router.post('/auth/logout', (req, res) => {
  try {
    // Effacer le cookie authToken
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS en production
      sameSite: 'strict',
    });
    return res.status(200).json({ msg: 'Déconnexion réussie' });
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
    return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

module.exports = router;
