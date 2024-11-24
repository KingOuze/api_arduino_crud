const express = require("express");
const client = require("../db/connect");
const { ObjectId } = require('mongodb');

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
  getWeeklyRecords,
  storeRecord,
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
router.get('/mesures/specific-times', async (req, res) => {
  try {
    const mesures = await Mesure.find().sort({ timestamp: -1 });

    // Filtrer les mesures pour obtenir celles à 10h, 14h et 17h
    const filteredMesures = mesures.filter(mesure => {
      const mesureDate = new Date(mesure.timestamp);
      const mesureHeur = mesureDate.getHours();
      const mesureMin = mesureDate.getMinutes();
      return (mesureHeur === 10 && mesureMin === 0) || 
             (mesureHeur === 14 && mesureMin === 0) || 
             (mesureHeur === 17 && mesureMin === 0);
    });

    const response = filteredMesures.map(mesure => ({
      temperature: mesure.temperature,
      humidity: mesure.humidity,
      timestamp: mesure.timestamp, // Ou tout autre format que vous souhaitez
    }));

    res.json.toString({
      message: 'Mesures récupérées avec succès',
      data: response,
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des données:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Route pour obtenir l'historique des mesures de la semaine
router.get('/historique/hebdomadaire', async (req, res) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Commence le lundi

    const mesures = await Mesure.find({
      timestamp: { $gte: startOfWeek }
    }).sort({ timestamp: 1 }); // Tri croissant par date

    const response = mesures.map(mesure => ({
      date: mesure.timestamp.toLocaleDateString('fr-FR', { weekday: 'long' }), // Récupère le jour de la semaine
      temperature: mesure.temperature,
      humidity: mesure.humidity,
    }));

    res.json({
      message: 'Historique des mesures récupéré avec succès',
      data: response,
    });
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'historique des mesures:', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
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
