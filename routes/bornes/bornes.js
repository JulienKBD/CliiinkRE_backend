const express = require('express');
const router = express.Router();
const pool = require('../../config/db.js');
const { createLogger } = require('../../utils/logger');
const log = createLogger('BORNES');

// GET - Toutes les bornes
router.get('/api/bornes', async (req, res) => {
    log.request(req);
    try {
        const { city, status, isActive } = req.query;
        let query = 'SELECT * FROM bornes WHERE 1=1';
        const params = [];

        if (city) { query += ' AND city = ?'; params.push(city); }
        if (status) { query += ' AND status = ?'; params.push(status); }
        if (isActive !== undefined) { query += ' AND isActive = ?'; params.push(isActive === 'true'); }

        query += ' ORDER BY city, name';

        log.debug('Query:', query, 'Params:', params);
        const [results] = await pool.query(query, params);
        log.success(req, 200, `${results.length} borne(s) retournée(s)`);
        res.json(results);
    } catch (err) {
        log.error(req, err, 'Erreur récupération bornes');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Stats summary
router.get('/api/bornes/stats/summary', async (req, res) => {
    log.request(req);
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
        log.success(req, 200, `Stats: ${results[0].totalBornes} bornes, ${results[0].totalCities} villes`);
        res.json(results[0]);
    } catch (err) {
        log.error(req, err, 'Erreur récupération stats bornes');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Cities list
router.get('/api/bornes/cities/list', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query('SELECT city, COUNT(*) as count FROM bornes WHERE isActive = true GROUP BY city ORDER BY city');
        log.success(req, 200, `${results.length} ville(s)`);
        res.json(results);
    } catch (err) {
        log.error(req, err, 'Erreur récupération villes');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Borne par ID
router.get('/api/bornes/:id', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query('SELECT * FROM bornes WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            log.warn(`Borne non trouvée: id=${req.params.id}`);
            return res.status(404).json({ error: 'Borne non trouvée' });
        }
        log.success(req, 200, `Borne "${results[0].name}" (${results[0].city})`);
        res.json(results[0]);
    } catch (err) {
        log.error(req, err, `Erreur récupération borne id=${req.params.id}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Créer borne
router.post('/api/bornes', async (req, res) => {
    log.request(req);
    try {
        const { name, address, city, zipCode, latitude, longitude, status, description, isActive } = req.body;
        if (!name || !address || !city || !zipCode || !latitude || !longitude) {
            log.warn('Création borne: champs requis manquants', { name, address, city, zipCode, latitude, longitude });
            return res.status(400).json({ error: 'Champs requis manquants' });
        }

        const id = `borne-${Date.now()}`;
        log.info(`Création borne: "${name}" à ${city} (${address})`);

        await pool.query(
            'INSERT INTO bornes (id, name, address, city, zipCode, latitude, longitude, status, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [id, name, address, city, zipCode, latitude, longitude, status || 'ACTIVE', description, isActive !== false ? 1 : 0]
        );
        log.success(req, 201, `Borne créée: "${name}" (id: ${id})`);
        res.status(201).json({ id, message: 'Borne créée avec succès' });
    } catch (err) {
        log.error(req, err, `Erreur création borne "${req.body.name || '?'}"`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT - Update borne
router.put('/api/bornes/:id', async (req, res) => {
    log.request(req);
    try {
        const { name, address, city, zipCode, latitude, longitude, status, description, isActive } = req.body;
        log.info(`Mise à jour borne id=${req.params.id}`);

        const [results] = await pool.query(
            `UPDATE bornes SET name = COALESCE(?, name), address = COALESCE(?, address), city = COALESCE(?, city),
             zipCode = COALESCE(?, zipCode), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude),
             status = COALESCE(?, status), description = COALESCE(?, description), isActive = COALESCE(?, isActive), updatedAt = NOW() WHERE id = ?`,
            [name, address, city, zipCode, latitude, longitude, status, description, isActive, req.params.id]
        );
        if (results.affectedRows === 0) {
            log.warn(`Borne non trouvée pour mise à jour: id=${req.params.id}`);
            return res.status(404).json({ error: 'Borne non trouvée' });
        }
        log.success(req, 200, `Borne mise à jour: id=${req.params.id}`);
        res.json({ message: 'Borne mise à jour avec succès' });
    } catch (err) {
        log.error(req, err, `Erreur mise à jour borne id=${req.params.id}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE - Supprimer borne
router.delete('/api/bornes/:id', async (req, res) => {
    log.request(req);
    try {
        log.info(`Suppression borne id=${req.params.id}`);
        const [results] = await pool.query('DELETE FROM bornes WHERE id = ?', [req.params.id]);
        if (results.affectedRows === 0) {
            log.warn(`Borne non trouvée pour suppression: id=${req.params.id}`);
            return res.status(404).json({ error: 'Borne non trouvée' });
        }
        log.success(req, 200, `Borne supprimée: id=${req.params.id}`);
        res.json({ message: 'Borne supprimée avec succès' });
    } catch (err) {
        log.error(req, err, `Erreur suppression borne id=${req.params.id}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
