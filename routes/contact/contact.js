const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

// Fonction pour vérifier le token reCAPTCHA (v2)
async function verifyRecaptcha(token) {
    if (!token) return { success: false };

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
        console.warn('reCAPTCHA secret key not configured');
        return { success: true }; // Bypass en dev si pas configuré
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${secretKey}&response=${token}`,
        });
        const data = await response.json();
        return { success: data.success };
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return { success: false };
    }
}

// GET all contact messages
router.get('/api/contact', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM contact_messages ORDER BY createdAt DESC');
        res.json(results);
    } catch (err) {
        console.error('Error fetching contact messages:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET contact message by id
router.get('/api/contact/:id', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching contact message:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST create contact message
router.post('/api/contact', async (req, res) => {
    try {
        const { type, name, email, message, companyName, phone, position, recaptchaToken } = req.body;

        // Vérifier le reCAPTCHA
        const recaptchaResult = await verifyRecaptcha(recaptchaToken);
        if (!recaptchaResult.success) {
            console.warn('reCAPTCHA verification failed:', recaptchaResult);
            return res.status(400).json({ error: 'Vérification anti-spam échouée. Veuillez cocher la case "Je ne suis pas un robot".' });
        }

        const id = `msg-${Date.now()}`;
        const [result] = await pool.query(
            'INSERT INTO contact_messages (id, type, name, email, message, companyName, phone, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, type || 'PARTICULIER', name, email, message, companyName || null, phone || null, position || null]
        );
        res.status(201).json({ id, message: 'Message envoyé avec succès' });
    } catch (err) {
        console.error('Error creating contact message:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT update contact message (mark as read)
router.put('/api/contact/:id/read', async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE contact_messages SET isRead = TRUE WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }
        res.json({ message: 'Message marqué comme lu' });
    } catch (err) {
        console.error('Error updating contact message:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT archive contact message
router.put('/api/contact/:id/archive', async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE contact_messages SET isArchived = TRUE WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }
        res.json({ message: 'Message archivé' });
    } catch (err) {
        console.error('Error archiving contact message:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE contact message
router.delete('/api/contact/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }
        res.json({ message: 'Message supprimé' });
    } catch (err) {
        console.error('Error deleting contact message:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
