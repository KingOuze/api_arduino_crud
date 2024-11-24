const client = require("../db/connect");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const JWT_SECRET = "jwt-secret";

const loginUser = async (req, res) => {
  const { email, password, code } = req.body;

  try {
    if (!email && !code) {
      return res.status(400).json({ msg: "Email ou code requis pour se connecter" });
    }

    const query = email ? { email } : { code };
    const user = await client.db().collection("users").findOne(query);

    if (!user) {
      return res.status(404).json({ msg: "Utilisateur non trouvé" });
    }

    if (email && password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ msg: "Mot de passe incorrect" });
      }
    } else if (code) {
      if (code !== user.code) {
        return res.status(401).json({ msg: "Code secret incorrect" });
      }
    } else {
      return res.status(400).json({ msg: "Méthode de connexion invalide" });
    }
    if(user.archived) {
      return res.status(403).json({ msg: "Utilisateur bloquée" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.cookie('authToken', token, {
      httpOnly: true, // Empêche l'accès au cookie depuis JavaScript côté client
      secure: false,  // Passez à true en production pour HTTPS
      sameSite: 'strict', // Empêche les requêtes CSRF (l'accès cross-site)
      maxAge: 8 * 60 * 60 * 1000 // Expire dans 72 heures
    });

    return res.status(200).json({ msg: "Connexion réussie", role: user.role });
  } catch (error) {
    console.error("Erreur pendant la connexion :", error);
    return res.status(500).json({ msg: "Erreur serveur", error });
  }
};

module.exports = { loginUser };