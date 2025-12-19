const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token)
        return res.status(401).json({ error: 'Token non fourni' });

    jwt.verify(token, process.env.SECRET || 'cliiink-secret-key', (err, user) => {
        if (err)
            return res.status(403).json({ error: 'Token invalide' });

        req.userId = user.id;
        req.userEmail = user.email;
        req.userName = user.name;
        req.userRole = user.role;
        next();
    });
}

function isAdmin(req, res, next) {
    if (req.userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Accès refusé - Admin requis' });
    }
    next();
}

module.exports = { authenticateToken, isAdmin };