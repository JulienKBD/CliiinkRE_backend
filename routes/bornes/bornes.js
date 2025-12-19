const express = require('express');
const router = express.Router();
const pool = require('../../config/db.js');

// GET - Toutes les bornes
router.get('/api/bornes', async (req, res) => {
    try {
        const { city, status, isActive } = req.query;
        let query = 'SELECT * FROM bornes WHERE 1=1';
        const params = [];

        if (city) { query += ' AND city = ?'; params.push(city); }
        if (status) { query += ' AND status = ?'; params.push(status); }
        if (isActive !== undefined) { query += ' AND isActive = ?'; params.push(isActive === 'true'); }

        query += ' ORDER BY city, name';

        const [results] = await pool.query(query, params);
        res.json(results);
    } catch (err) {
        console.error('Error fetching bornes:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Stats summary
router.get('/api/bornes/stats/summary', async (req, res) => {
    try {
        const query = `
            SELECT COUNT(*) as totalBornes,
                SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activeBornes,
                SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenanceBornes,
                SUM(CASE WHEN status = 'FULL' THEN 1 ELSE 0 END) as fullBornes,
                COUNT(DISTINCT city) as totalCities
            FROM bornes WHERE isActive = true
        `;
        const [results] = await pool.query(query);
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching bornes stats:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Cities list
router.get('/api/bornes/cities/list', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT city, COUNT(*) as count FROM bornes WHERE isActive = true GROUP BY city ORDER BY city');
        res.json(results);
    } catch (err) {
        console.error('Error fetching cities:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Borne par ID
router.get('/api/bornes/:id', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM bornes WHERE id = ?', [req.params.id]);
        if (results.length === 0) return res.status(404).json({ error: 'Borne non trouvée' });
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching borne:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Créer borne
router.post('/api/bornes', async (req, res) => {
    try {
        const { name, address, city, zipCode, latitude, longitude, status, description } = req.body;
        if (!name || !address || !city || !zipCode || !latitude || !longitude) {
            return res.status(400).json({ error: 'Champs requis manquants' });
        }
        
        const id = `borne-${Date.now()}`;
        await pool.query(
            'INSERT INTO bornes (id, name, address, city, zipCode, latitude, longitude, status, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [id, name, address, city, zipCode, latitude, longitude, status || 'ACTIVE', description]
        );
        res.status(201).json({ id, message: 'Borne créée avec succès' });
    } catch (err) {
        console.error('Error creating borne:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT - Update borne
router.put('/api/bornes/:id', async (req, res) => {
    try {
        const { name, address, city, zipCode, latitude, longitude, status, description, isActive } = req.body;
        const [results] = await pool.query(
            `UPDATE bornes SET name = COALESCE(?, name), address = COALESCE(?, address), city = COALESCE(?, city),
             zipCode = COALESCE(?, zipCode), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude),
             status = COALESCE(?, status), description = COALESCE(?, description), isActive = COALESCE(?, isActive), updatedAt = NOW() WHERE id = ?`,
            [name, address, city, zipCode, latitude, longitude, status, description, isActive, req.params.id]
        );
        if (results.affectedRows === 0) return res.status(404).json({ error: 'Borne non trouvée' });
        res.json({ message: 'Borne mise à jour avec succès' });
    } catch (err) {
        console.error('Error updating borne:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE - Supprimer borne
router.delete('/api/bornes/:id', async (req, res) => {
    try {
        const [results] = await pool.query('DELETE FROM bornes WHERE id = ?', [req.params.id]);
        if (results.affectedRows === 0) return res.status(404).json({ error: 'Borne non trouvée' });
        res.json({ message: 'Borne supprimée avec succès' });
    } catch (err) {
        console.error('Error deleting borne:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
