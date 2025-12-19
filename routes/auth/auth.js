const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db.js');

// POST - Login
router.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    
    try {
        const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.SECRET || 'cliiink-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Register
router.post('/api/auth/register', async (req, res) => {
    const { email, password, name, role } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    
    try {
        const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const id = `user-${Date.now()}`;
        
        await pool.query(
            'INSERT INTO users (id, email, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [id, email, hashedPassword, name, role || 'EDITOR']
        );
        
        res.status(201).json({ id, message: 'Utilisateur créé avec succès' });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Me
router.get('/api/auth/me', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token non fourni' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.SECRET || 'cliiink-secret-key');
        const [results] = await pool.query('SELECT id, email, name, role FROM users WHERE id = ?', [decoded.id]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching user:', err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token invalide' });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT - Password
router.put('/api/auth/password', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    const { currentPassword, newPassword } = req.body;
    
    if (!token) {
        return res.status(401).json({ error: 'Token non fourni' });
    }
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Mot de passe actuel et nouveau requis' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.SECRET || 'cliiink-secret-key');
        const [results] = await pool.query('SELECT password FROM users WHERE id = ?', [decoded.id]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        const isMatch = await bcrypt.compare(currentPassword, results[0].password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await pool.query('UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?', [hashedPassword, decoded.id]);
        
        res.json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (err) {
        console.error('Error updating password:', err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token invalide' });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
