const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { createLogger, handleSqlError } = require('../../utils/logger');
const log = createLogger('PARTNERS');

// Helper function to ensure proper format for partners
const transformPartner = (partner) => {
    if (!partner) return null;
    return {
        id: partner.id,
        name: partner.name,
        slug: partner.slug,
        description: partner.description,
        longDescription: partner.longDescription,
        category: partner.category,
        address: partner.address,
        city: partner.city,
        zipCode: partner.zipCode,
        latitude: partner.latitude,
        longitude: partner.longitude,
        phone: partner.phone,
        email: partner.email,
        website: partner.website,
        logoUrl: partner.logoUrl || null,
        imageUrl: partner.imageUrl || null,
        advantages: partner.advantages ? (typeof partner.advantages === 'string' ? JSON.parse(partner.advantages) : partner.advantages) : [],
        pointsRequired: partner.pointsRequired,
        discount: partner.discount,
        isActive: Boolean(partner.isActive),
        isFeatured: Boolean(partner.isFeatured),
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt
    };
};

// GET all partners
router.get('/api/partners', async (req, res) => {
    log.request(req);
    try {
        const { category, isFeatured, isActive } = req.query;
        let query = 'SELECT * FROM partners WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (isFeatured === 'true') {
            query += ' AND isFeatured = 1';
        }
        if (isActive !== undefined) {
            query += ' AND isActive = ?';
            params.push(isActive === 'true' ? 1 : 0);
        }

        query += ' ORDER BY name ASC';

        log.debug('Query:', query, 'Params:', params);
        const [results] = await pool.query(query, params);
        log.success(req, 200, `${results.length} partenaire(s) retourné(s)`);
        res.json(results.map(transformPartner));
    } catch (err) {
        log.error(req, err, 'Erreur récupération partenaires');
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des partenaires.' });
    }
});

// GET partner categories with count
router.get('/api/partners/categories/list', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query(
            'SELECT category, COUNT(*) as count FROM partners WHERE isActive = 1 GROUP BY category'
        );
        log.success(req, 200, `${results.length} catégorie(s)`);
        res.json(results);
    } catch (err) {
        log.error(req, err, 'Erreur récupération catégories partenaires');
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des catégories.' });
    }
});

// GET partner by slug
router.get('/api/partners/slug/:slug', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query('SELECT * FROM partners WHERE slug = ?', [req.params.slug]);
        if (results.length === 0) {
            log.warn(`Partenaire non trouvé: slug=${req.params.slug}`);
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }
        log.success(req, 200, `Partenaire "${results[0].name}"`);
        res.json(transformPartner(results[0]));
    } catch (err) {
        log.error(req, err, `Erreur récupération partenaire slug=${req.params.slug}`);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération du partenaire.' });
    }
});

// GET partner by id
router.get('/api/partners/id/:id', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query('SELECT * FROM partners WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            log.warn(`Partenaire non trouvé: id=${req.params.id}`);
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }
        log.success(req, 200, `Partenaire "${results[0].name}"`);
        res.json(transformPartner(results[0]));
    } catch (err) {
        log.error(req, err, `Erreur récupération partenaire id=${req.params.id}`);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération du partenaire.' });
    }
});

// POST create partner
router.post('/api/partners', async (req, res) => {
    log.request(req);
    try {
        const {
            name, slug, description, longDescription, category,
            address, city, zipCode, latitude, longitude,
            phone, email, website, logoUrl, imageUrl,
            advantages, pointsRequired, discount, isActive, isFeatured
        } = req.body;

        const advantagesJson = advantages ? JSON.stringify(advantages) : '[]';
        const now = new Date();
        const id = 'partner-' + Date.now();

        log.info(`Création partenaire: "${name}" (slug: ${slug}, catégorie: ${category}, ville: ${city})`);

        const insertQuery = 'INSERT INTO partners (id, name, slug, description, longDescription, category, address, city, zipCode, latitude, longitude, phone, email, website, logoUrl, imageUrl, advantages, pointsRequired, discount, isActive, isFeatured, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        await pool.query(insertQuery,
            [id, name, slug, description, longDescription, category, address, city, zipCode,
            latitude, longitude, phone, email, website, logoUrl, imageUrl,
            advantagesJson, pointsRequired, discount, isActive ? 1 : 0, isFeatured ? 1 : 0, now, now]
        );

        const [newPartner] = await pool.query('SELECT * FROM partners WHERE id = ?', [id]);
        log.success(req, 201, `Partenaire créé: "${name}" (id: ${id})`);
        res.status(201).json(transformPartner(newPartner[0]));
    } catch (err) {
        if (handleSqlError(log, req, res, err, `Erreur création partenaire "${req.body.name || '?'}"`)) return;
        log.error(req, err, `Erreur création partenaire "${req.body.name || '?'}"`);
        res.status(500).json({ error: 'Erreur serveur lors de la création du partenaire.' });
    }
});

// PUT update partner
router.put('/api/partners/:id', async (req, res) => {
    log.request(req);
    try {
        const {
            name, slug, description, longDescription, category,
            address, city, zipCode, latitude, longitude,
            phone, email, website, logoUrl, imageUrl,
            advantages, pointsRequired, discount, isActive, isFeatured
        } = req.body;

        const advantagesJson = advantages ? JSON.stringify(advantages) : '[]';
        const now = new Date();

        log.info(`Mise à jour partenaire id=${req.params.id}: "${name}"`);

        const updateQuery = 'UPDATE partners SET name = ?, slug = ?, description = ?, longDescription = ?, category = ?, address = ?, city = ?, zipCode = ?, latitude = ?, longitude = ?, phone = ?, email = ?, website = ?, logoUrl = ?, imageUrl = ?, advantages = ?, pointsRequired = ?, discount = ?, isActive = ?, isFeatured = ?, updatedAt = ? WHERE id = ?';

        const [result] = await pool.query(updateQuery,
            [name, slug, description, longDescription, category,
            address, city, zipCode, latitude, longitude,
            phone, email, website, logoUrl, imageUrl,
            advantagesJson, pointsRequired, discount, isActive ? 1 : 0, isFeatured ? 1 : 0, now, req.params.id]
        );

        if (result.affectedRows === 0) {
            log.warn(`Partenaire non trouvé pour mise à jour: id=${req.params.id}`);
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }

        const [updated] = await pool.query('SELECT * FROM partners WHERE id = ?', [req.params.id]);
        log.success(req, 200, `Partenaire mis à jour: "${name}" (id: ${req.params.id})`);
        res.json(transformPartner(updated[0]));
    } catch (err) {
        if (handleSqlError(log, req, res, err, `Erreur mise à jour partenaire id=${req.params.id} "${req.body.name || '?'}"`)) return;
        log.error(req, err, `Erreur mise à jour partenaire id=${req.params.id} "${req.body.name || '?'}"`);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du partenaire.' });
    }
});

// DELETE partner
router.delete('/api/partners/:id', async (req, res) => {
    log.request(req);
    try {
        log.info(`Suppression partenaire id=${req.params.id}`);
        const [result] = await pool.query('DELETE FROM partners WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            log.warn(`Partenaire non trouvé pour suppression: id=${req.params.id}`);
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }
        log.success(req, 200, `Partenaire supprimé: id=${req.params.id}`);
        res.json({ message: 'Partenaire supprimé' });
    } catch (err) {
        if (handleSqlError(log, req, res, err, `Erreur suppression partenaire id=${req.params.id}`)) return;
        log.error(req, err, `Erreur suppression partenaire id=${req.params.id}`);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression du partenaire.' });
    }
});

module.exports = router;
