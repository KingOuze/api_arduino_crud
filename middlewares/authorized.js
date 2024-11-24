const authorizeAdmin = (req, res, next) => {
    // Vérifie si le rôle est présent
    if (!req.user || !req.user.role) {
        return res.status(403).json({ message: "Accès refusé. Rôle non défini." });
    }

    // Vérifie si le rôle est 'admin'
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accès refusé. Privilèges insuffisants." });
    }

    // Autorisation accordée
    next();
};

module.exports = authorizeAdmin;