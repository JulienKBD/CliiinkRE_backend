const express = require('express');
const router = express.Router();
const pool = require('../../config/db.js');

// GET - Toute la config
router.get('/api/config', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT `key`, value, description FROM site_config');
        const config = {};
        results.forEach(item => { config[item.key] = item.value; });
        res.json(config);
    } catch (err) {
        console.error('Error fetching config:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Config par clé
router.get('/api/config/:key', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT value, description FROM site_config WHERE `key` = ?', [req.params.key]);
        if (results.length === 0) return res.status(404).json({ error: 'Configuration non trouvée' });
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching config by key:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT - Update config
router.put('/api/config/:key', async (req, res) => {
    try {
        const { value } = req.body;
        if (value === undefined) return res.status(400).json({ error: 'Valeur requise' });

        const [result] = await pool.query('UPDATE site_config SET value = ?, updatedAt = NOW() WHERE `key` = ?', [value, req.params.key]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Configuration non trouvée' });
        res.json({ message: 'Configuration mise à jour avec succès' });
    } catch (err) {
        console.error('Error updating config:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Créer config
router.post('/api/config', async (req, res) => {
    try {
        const { key, value, description } = req.body;
        if (!key || value === undefined) return res.status(400).json({ error: 'Clé et valeur requises' });

        const id = `config-${Date.now()}`;
        await pool.query('INSERT INTO site_config (id, `key`, value, description, updatedAt) VALUES (?, ?, ?, ?, NOW())', [id, key, value, description]);
        res.status(201).json({ message: 'Configuration créée avec succès' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Cette clé existe déjà' });
        console.error('Error creating config:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE - Supprimer config
router.delete('/api/config/:key', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM site_config WHERE `key` = ?', [req.params.key]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Configuration non trouvée' });
        res.json({ message: 'Configuration supprimée avec succès' });
    } catch (err) {
        console.error('Error deleting config:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
