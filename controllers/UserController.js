const { ObjectId }  = require("mongodb");
const client = require("../db/connect");
const User = require("../models/User");
const bcrypt = require("bcrypt");

const index = async (req, res) => { 
  res.status(200).json({ msg: "Bienvenue a l'Acceuil Admin" });
}
const storeUser = async (req, res) => {
  try {
    const { nom, prenom, email, password, code, role } = req.body;

    if (!nom || !prenom || !email || !password || !code || !role) {
      return res.status(400).json({ msg: "Données utilisateur incomplètes" });
    }

    // Vérification de l'unicité de l'email
    const existingUser = await client.db().collection("users").findOne({ email });

    if (existingUser) {
      return res.status(400).json({ msg: "Cet email est déjà utilisé." });
    }

    // Vérification de l'unicité du code secret

    const existingCode = await client.db().collection("users").findOne({ code });

    if (existingCode) {
      return res.status(400).json({ msg: "Ce Code est déjà utilisé." });
    }


    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur avec le mot de passe haché
    let user = new User({
      nom,
      prenom,
      telephone,
      email,
      password: hashedPassword,
      code,
      role
    });

    // Sauvegarde de l'utilisateur dans la base de données
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.log(error);
    res.status(501).json({ msg: "Erreur lors de la création de l'utilisateur", error });
  }
};

const getAllUsers = async (req, res) => {
  try {
    let cursor = client.db().collection("users").find().sort({ noms: 1 });
    let result = await cursor.toArray();

    if (result.length > 0) {
      // Réponse avec les utilisateurs trouvés
      return res.status(200).json(result);
    } else {
      // Réponse avec "No Content" si aucun utilisateur n'est trouvé
      return res.status(204).json({ msg: "Aucun utilisateur trouvé" });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    // Réponse en cas d'erreur serveur
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
};


const findUser = async (req, res) => {
  try {
      const id = req.params.id; 
      const user = await client.db().collection("users").findOne({ _id: new ObjectId(id) });
      if (user) {
          res.status(200).json(user);
      } else {
          res.status(404).json({ msg: "Utilisateur non trouvé" });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Erreur de serveur" });
  }
};


const updateUser = async (req, res) => {
  const id = req.params.id;

  // Validation de l'ID
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID invalide" });
  }

  // Construction de l'objet des champs à mettre à jour
  const fieldsToUpdate = {};
  if (req.body.nom) fieldsToUpdate.nom = req.body.nom;
  if (req.body.prenom) fieldsToUpdate.prenom = req.body.prenom;
  if (req.body.email) fieldsToUpdate.email = req.body.email;
  if (req.body.code) fieldsToUpdate.code = req.body.code;
  if (req.body.role) fieldsToUpdate.role = req.body.role;
  if (req.body.telephone) fieldsToUpdate.telephone = req.body.telephone;

  try {
    const result = await client
      .db()
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: fieldsToUpdate });

    if (result.modifiedCount === 1) {
      res.status(200).json({ msg: "Modification réussie" });
    } else {
      res.status(404).json({ msg: "Cet utilisateur n'existe pas" });
    }
  } catch (error) {
    console.log(error);
    res.status(501).json(error);
  }
};

const listArchived = async (req, res) => {
  try {
    const archivedUsers = await User.find({ archived: true });
    if (archivedUsers.length === 0) {
      return res.status(204).json({ message: 'Aucun utilisateur archivé trouvé' }); // Modifier 'msg' en 'message'
    }
    res.status(200).json(archivedUsers);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs archivés' });
  }
}

const deleteUser = async (req, res) => {
  const userId = req.params.id; // Vous pouvez obtenir l'ID de l'utilisateur à partir du token JWT ou de la session
  try {
        console.log(userId);
        await User.findByIdAndUpdate(userId, { archived: true });
        res.status(200).json({ message: 'Utilisateur archivé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de l\'archivage de l\'utilisateur' });
    }
};

const desarchivedUser = async (req, res) => {
  try {
    const userId = req.user.id; // Vous pouvez obtenir l'ID de l'utilisateur à partir du token JWT ou de la session
    await User.findByIdAndUpdate(userId, { archived: false });
    res.status(200).json({ message: 'Utilisateur désarchivé avec succès' });
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors du désarchivage de l\'utilisateur' });
}
};


module.exports = {
  index,
  storeUser,
  getAllUsers,
  findUser,
  updateUser,
  deleteUser,
  listArchived,
  desarchivedUser
};
