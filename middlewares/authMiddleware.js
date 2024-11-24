// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = "jwt-secret";

function isAuthenticated(req, res, next) {
      // Récupérer le token depuis les cookies
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ error: 'Veuillez vous connecter' });
    }
  
    try {
      // Vérifier le token JWT
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Ajoute les informations de l'utilisateur à req
      next(); // Passe à la route suivante
    } catch (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
}

module.exports = isAuthenticated;

