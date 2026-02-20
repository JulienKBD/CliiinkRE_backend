const express = require('express');
const router = express.Router();
const pool = require('../../config/db.js');
const { createLogger } = require('../../utils/logger');
const log = createLogger('CONFIG');

// GET - Toute la config
router.get('/api/config', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query('SELECT `key`, value, description FROM site_config');
        const config = {};
        results.forEach(item => { config[item.key] = item.value; });
        log.success(req, 200, `${results.length} clé(s) de config retournée(s)`);
        res.json(config);
    } catch (err) {
        log.error(req, err, 'Erreur récupération config');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Config par clé
router.get('/api/config/:key', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query('SELECT value, description FROM site_config WHERE `key` = ?', [req.params.key]);
        if (results.length === 0) {
            log.warn(`Config non trouvée: key=${req.params.key}`);
            return res.status(404).json({ error: 'Configuration non trouvée' });
        }
        log.success(req, 200, `Config key=${req.params.key}`);
        res.json(results[0]);
    } catch (err) {
        log.error(req, err, `Erreur récupération config key=${req.params.key}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT - Update config
router.put('/api/config/:key', async (req, res) => {
    log.request(req);
    try {
        const { value } = req.body;
        if (value === undefined) {
            log.warn(`Mise à jour config: valeur manquante pour key=${req.params.key}`);
            return res.status(400).json({ error: 'Valeur requise' });
        }

        log.info(`Mise à jour config: key=${req.params.key}, value=${String(value).substring(0, 100)}`);
        const [result] = await pool.query('UPDATE site_config SET value = ?, updatedAt = NOW() WHERE `key` = ?', [value, req.params.key]);
        if (result.affectedRows === 0) {
            log.warn(`Config non trouvée pour mise à jour: key=${req.params.key}`);
            return res.status(404).json({ error: 'Configuration non trouvée' });
        }
        log.success(req, 200, `Config mise à jour: key=${req.params.key}`);
        res.json({ message: 'Configuration mise à jour avec succès' });
    } catch (err) {
        log.error(req, err, `Erreur mise à jour config key=${req.params.key}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Créer config
router.post('/api/config', async (req, res) => {
    log.request(req);
    try {
        const { key, value, description } = req.body;
        if (!key || value === undefined) {
            log.warn('Création config: clé ou valeur manquante');
            return res.status(400).json({ error: 'Clé et valeur requises' });
        }

        const id = `config-${Date.now()}`;
        log.info(`Création config: key=${key}, value=${String(value).substring(0, 100)}`);
        await pool.query('INSERT INTO site_config (id, `key`, value, description, updatedAt) VALUES (?, ?, ?, ?, NOW())', [id, key, value, description]);
        log.success(req, 201, `Config créée: key=${key}`);
        res.status(201).json({ message: 'Configuration créée avec succès' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            log.warn(`Config doublon: key=${req.body.key}`);
            return res.status(400).json({ error: 'Cette clé existe déjà' });
        }
        log.error(req, err, `Erreur création config key=${req.body.key}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE - Supprimer config
router.delete('/api/config/:key', async (req, res) => {
    log.request(req);
    try {
        log.info(`Suppression config: key=${req.params.key}`);
        const [result] = await pool.query('DELETE FROM site_config WHERE `key` = ?', [req.params.key]);
        if (result.affectedRows === 0) {
            log.warn(`Config non trouvée pour suppression: key=${req.params.key}`);
            return res.status(404).json({ error: 'Configuration non trouvée' });
        }
        log.success(req, 200, `Config supprimée: key=${req.params.key}`);
        res.json({ message: 'Configuration supprimée avec succès' });
    } catch (err) {
        log.error(req, err, `Erreur suppression config key=${req.params.key}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
