const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

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

        const [results] = await pool.query(query, params);
        res.json(results.map(transformPartner));
    } catch (err) {
        console.error('[GET /api/partners] Erreur récupération partenaires:', err.code || err.message);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des partenaires.' });
    }
});

// GET partner categories with count
router.get('/api/partners/categories/list', async (req, res) => {
    try {
        const [results] = await pool.query(
            'SELECT category, COUNT(*) as count FROM partners WHERE isActive = 1 GROUP BY category'
        );
        res.json(results);
    } catch (err) {
        console.error('[GET /api/partners/categories/list] Erreur:', err.code || err.message);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des catégories.' });
    }
});

// GET partner by slug
router.get('/api/partners/slug/:slug', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM partners WHERE slug = ?', [req.params.slug]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }
        res.json(transformPartner(results[0]));
    } catch (err) {
        console.error(`[GET /api/partners/slug/${req.params.slug}] Erreur:`, err.code || err.message);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération du partenaire.' });
    }
});

// GET partner by id
router.get('/api/partners/id/:id', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM partners WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }
        res.json(transformPartner(results[0]));
    } catch (err) {
        console.error(`[GET /api/partners/id/${req.params.id}] Erreur:`, err.code || err.message);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération du partenaire.' });
    }
});

// POST create partner
router.post('/api/partners', async (req, res) => {
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

        const insertQuery = 'INSERT INTO partners (id, name, slug, description, longDescription, category, address, city, zipCode, latitude, longitude, phone, email, website, logoUrl, imageUrl, advantages, pointsRequired, discount, isActive, isFeatured, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        await pool.query(insertQuery,
            [id, name, slug, description, longDescription, category, address, city, zipCode,
            latitude, longitude, phone, email, website, logoUrl, imageUrl,
            advantagesJson, pointsRequired, discount, isActive ? 1 : 0, isFeatured ? 1 : 0, now, now]
        );

        const [newPartner] = await pool.query('SELECT * FROM partners WHERE id = ?', [id]);
        res.status(201).json(transformPartner(newPartner[0]));
    } catch (err) {
        console.error(`[POST /api/partners] Erreur création partenaire "${req.body.name || '?'}":`, err.code || err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            const field = err.sqlMessage?.includes('slug') ? 'slug' : 'id';
            console.error(`  → Doublon détecté sur le champ "${field}" (valeur: ${field === 'slug' ? req.body.slug : 'auto'})`);
            return res.status(409).json({ error: `Un partenaire avec ce ${field === 'slug' ? 'slug (URL)' : 'identifiant'} existe déjà. Veuillez modifier le nom pour générer un slug différent.` });
        }
        if (err.code === 'ER_DATA_TOO_LONG') {
            console.error(`  → Donnée trop longue:`, err.sqlMessage);
            return res.status(400).json({ error: 'Un des champs dépasse la taille maximale autorisée.' });
        }
        res.status(500).json({ error: 'Erreur serveur lors de la création du partenaire.' });
    }
});

// PUT update partner
router.put('/api/partners/:id', async (req, res) => {
    try {
        const {
            name, slug, description, longDescription, category,
            address, city, zipCode, latitude, longitude,
            phone, email, website, logoUrl, imageUrl,
            advantages, pointsRequired, discount, isActive, isFeatured
        } = req.body;

        const advantagesJson = advantages ? JSON.stringify(advantages) : '[]';
        const now = new Date();

        const updateQuery = 'UPDATE partners SET name = ?, slug = ?, description = ?, longDescription = ?, category = ?, address = ?, city = ?, zipCode = ?, latitude = ?, longitude = ?, phone = ?, email = ?, website = ?, logoUrl = ?, imageUrl = ?, advantages = ?, pointsRequired = ?, discount = ?, isActive = ?, isFeatured = ?, updatedAt = ? WHERE id = ?';

        const [result] = await pool.query(updateQuery,
            [name, slug, description, longDescription, category,
            address, city, zipCode, latitude, longitude,
            phone, email, website, logoUrl, imageUrl,
            advantagesJson, pointsRequired, discount, isActive ? 1 : 0, isFeatured ? 1 : 0, now, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }

        const [updated] = await pool.query('SELECT * FROM partners WHERE id = ?', [req.params.id]);
        res.json(transformPartner(updated[0]));
    } catch (err) {
        console.error(`[PUT /api/partners/${req.params.id}] Erreur mise à jour partenaire "${req.body.name || '?'}":`, err.code || err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            const field = err.sqlMessage?.includes('slug') ? 'slug' : 'id';
            console.error(`  → Doublon détecté sur le champ "${field}" (valeur: ${field === 'slug' ? req.body.slug : req.params.id})`);
            return res.status(409).json({ error: `Un autre partenaire utilise déjà ce ${field === 'slug' ? 'slug (URL)' : 'identifiant'}. Veuillez modifier le nom pour générer un slug différent.` });
        }
        if (err.code === 'ER_DATA_TOO_LONG') {
            console.error(`  → Donnée trop longue:`, err.sqlMessage);
            return res.status(400).json({ error: 'Un des champs dépasse la taille maximale autorisée.' });
        }
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du partenaire.' });
    }
});

// DELETE partner
router.delete('/api/partners/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM partners WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }
        res.json({ message: 'Partenaire supprimé' });
    } catch (err) {
        console.error(`[DELETE /api/partners/${req.params.id}] Erreur suppression:`, err.code || err.message);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'Ce partenaire est référencé ailleurs et ne peut pas être supprimé.' });
        }
        res.status(500).json({ error: 'Erreur serveur lors de la suppression du partenaire.' });
    }
});

module.exports = router;
