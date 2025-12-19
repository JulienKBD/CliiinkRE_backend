const express = require('express');
const router = express.Router();
const pool = require('../../config/db.js');

// GET - Toute la config
router.get('/api/config', (req, res) => {
    pool.query('SELECT `key`, value, description FROM site_config', (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        const config = {};
        results.forEach(item => { config[item.key] = item.value; });
        res.json(config);
    });
});

// GET - Config par clé
router.get('/api/config/:key', (req, res) => {
    pool.query('SELECT value, description FROM site_config WHERE `key` = ?', [req.params.key], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        if (results.length === 0) return res.status(404).json({ error: 'Configuration non trouvée' });
        res.json(results[0]);
    });
});

// PUT - Update config
router.put('/api/config/:key', (req, res) => {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'Valeur requise' });
    
    pool.query('UPDATE site_config SET value = ?, updatedAt = NOW() WHERE `key` = ?', [value, req.params.key], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        if (results.affectedRows === 0) return res.status(404).json({ error: 'Configuration non trouvée' });
        res.json({ message: 'Configuration mise à jour avec succès' });
    });
});

// POST - Créer config
router.post('/api/config', (req, res) => {
    const { key, value, description } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: 'Clé et valeur requises' });
    
    const id = `config-${Date.now()}`;
    pool.query('INSERT INTO site_config (id, `key`, value, description, updatedAt) VALUES (?, ?, ?, ?, NOW())', [id, key, value, description], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Cette clé existe déjà' });
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.status(201).json({ message: 'Configuration créée avec succès' });
    });
});

// DELETE - Supprimer config
router.delete('/api/config/:key', (req, res) => {
    pool.query('DELETE FROM site_config WHERE `key` = ?', [req.params.key], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        if (results.affectedRows === 0) return res.status(404).json({ error: 'Configuration non trouvée' });
        res.json({ message: 'Configuration supprimée avec succès' });
    });
});

module.exports = router;
