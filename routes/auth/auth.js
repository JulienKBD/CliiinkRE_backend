const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db.js');
const { createLogger } = require('../../utils/logger');
const log = createLogger('AUTH');

// POST - Login
router.post('/api/auth/login', async (req, res) => {
    log.request(req);
    const { email, password } = req.body;

    if (!email || !password) {
        log.warn('Tentative de login sans email ou mot de passe');
        return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    try {
        log.info(`Tentative de login pour: ${email}`);
        const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (results.length === 0) {
            log.warn(`Login échoué: email non trouvé (${email})`);
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            log.warn(`Login échoué: mot de passe incorrect pour ${email}`);
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.SECRET || 'cliiink-secret-key',
            { expiresIn: '24h' }
        );

        log.success(req, 200, `Login réussi pour ${email} (role: ${user.role})`);
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    } catch (err) {
        log.error(req, err, `Erreur login pour ${email}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Register
router.post('/api/auth/register', async (req, res) => {
    log.request(req);
    const { email, password, firstName, lastName, phone, name, role } = req.body;

    if (!email || !password) {
        log.warn('Tentative d\'inscription sans email ou mot de passe');
        return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    try {
        log.info(`Tentative d'inscription: ${email}`);
        const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            log.warn(`Inscription refusée: email déjà utilisé (${email})`);
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const id = `user-${Date.now()}`;

        // Build name from firstName/lastName or use provided name
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : name || 'Utilisateur';

        await pool.query(
            'INSERT INTO users (id, email, password, name, phone, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [id, email, hashedPassword, fullName, phone || null, role || 'USER']
        );

        log.success(req, 201, `Utilisateur créé: ${email} (id: ${id}, role: ${role || 'USER'})`);
        res.status(201).json({ id, message: 'Utilisateur créé avec succès' });
    } catch (err) {
        log.error(req, err, `Erreur inscription pour ${email}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Me
router.get('/api/auth/me', async (req, res) => {
    log.request(req);
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        log.warn('Accès /me sans token');
        return res.status(401).json({ error: 'Token non fourni' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET || 'cliiink-secret-key');
        log.debug(`Token décodé pour user id: ${decoded.id}`);
        const [results] = await pool.query('SELECT id, email, name, role FROM users WHERE id = ?', [decoded.id]);

        if (results.length === 0) {
            log.warn(`Utilisateur non trouvé pour id: ${decoded.id}`);
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        log.success(req, 200, `User: ${results[0].email}`);
        res.json(results[0]);
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            log.warn(`Token invalide: ${err.message}`);
            return res.status(401).json({ error: 'Token invalide' });
        }
        log.error(req, err, 'Erreur récupération profil');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT - Password
router.put('/api/auth/password', async (req, res) => {
    log.request(req);
    const token = req.headers['authorization']?.split(' ')[1];
    const { currentPassword, newPassword } = req.body;

    if (!token) {
        log.warn('Changement de mot de passe sans token');
        return res.status(401).json({ error: 'Token non fourni' });
    }

    if (!currentPassword || !newPassword) {
        log.warn('Changement de mot de passe: champs manquants');
        return res.status(400).json({ error: 'Mot de passe actuel et nouveau requis' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET || 'cliiink-secret-key');
        log.info(`Changement de mot de passe pour user id: ${decoded.id}`);
        const [results] = await pool.query('SELECT password FROM users WHERE id = ?', [decoded.id]);

        if (results.length === 0) {
            log.warn(`Utilisateur non trouvé: id=${decoded.id}`);
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const isMatch = await bcrypt.compare(currentPassword, results[0].password);
        if (!isMatch) {
            log.warn(`Mot de passe actuel incorrect pour user id: ${decoded.id}`);
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await pool.query('UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?', [hashedPassword, decoded.id]);

        log.success(req, 200, `Mot de passe mis à jour pour user id: ${decoded.id}`);
        res.json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            log.warn(`Token invalide lors du changement de mot de passe: ${err.message}`);
            return res.status(401).json({ error: 'Token invalide' });
        }
        log.error(req, err, 'Erreur changement de mot de passe');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
