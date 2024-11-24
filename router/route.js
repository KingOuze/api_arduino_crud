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
  getRecords,
} = require("../controllers/MesureController");


const isAuthenticated = require("../middlewares/authMiddleware"); // Importation du middleware
const authorizeAdmin = require("../middlewares/authorized");

const router = express.Router();

// Connexion des utilisateurs (pas besoin de middleware)
router.route("/auth/login").post(loginUser);

// Gestion des utilisateurs (ajout du middleware d'authentification)
router.route("/users").post(isAuthenticated, authorizeAdmin, storeUser);
router.route("/users").get(isAuthenticated, authorizeAdmin, getAllUsers);
router.route("/user/:id").get(isAuthenticated,authorizeAdmin, findUser);
router.route("/user/:id").put(isAuthenticated, authorizeAdmin, updateUser);
router.route("/user/:id/archived").delete(isAuthenticated, authorizeAdmin, deleteUser);
router.route("/user/:id/unarchived").post(isAuthenticated, authorizeAdmin, desarchivedUser);
router.route("/users/list-archived").get(isAuthenticated, authorizeAdmin, listArchived);

// Route pour récupérer les enregistrements de la semaine courante
router.get('/records', isAuthenticated, getWeeklyRecords);
router.post('/records', isAuthenticated, authorizeAdmin, storeRecord);

// Route pour changer le rôle
router.put('/user/:id/switch-role', isAuthenticated , authorizeAdmin, async (req, res) => {
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

//Route pour recupérer la moyenne de l'humidité et de la temperature journaliere
router.get('/moyenne-jounaliere', isAuthenticated, async (req, res) => {

  try {
    const allRecords = await getRecords();
    if (allRecords) {
        res.json(allRecords);
    } else {
        res.status(404).json({ message: 'Les données pour les trois horaires spécifiés ne sont pas toutes présentes.' });
    }
  } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      res.status(500).json({ message: 'Une erreur est survenue lors de la récupération des données.' });
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
