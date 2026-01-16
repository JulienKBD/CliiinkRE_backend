const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

// GET all partners (with optional filters)
router.get('/api/partners', async (req, res) => {
    try {
        const { category, isActive, isFeatured, city, limit } = req.query;

        let query = 'SELECT * FROM partners WHERE 1=1';
        const params = [];

        // Filter by category
        if (category && category !== 'ALL') {
            query += ' AND category = ?';
            params.push(category);
        }

        // Filter by isActive
        if (isActive !== undefined) {
            query += ' AND isActive = ?';
            params.push(isActive === 'true' ? 1 : 0);
        }

        // Filter by isFeatured
        if (isFeatured !== undefined) {
            query += ' AND isFeatured = ?';
            params.push(isFeatured === 'true' ? 1 : 0);
        }

        // Filter by city
        if (city) {
            query += ' AND city = ?';
            params.push(city);
        }

        // Order by name
        query += ' ORDER BY name ASC';

        // Limit results
        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit, 10));
        }

        const [results] = await pool.query(query, params);
        res.json(results);
    } catch (err) {
        console.error('Error fetching partners:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET partner by ID (for admin)
router.get('/api/partners/id/:id', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM partners WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching partner by id:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET partner by slug
router.get('/api/partners/slug/:slug', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM partners WHERE slug = ?', [req.params.slug]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching partner:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST create partner
router.post('/api/partners', async (req, res) => {
    try {
        const {
            name, slug, description, longDescription, category,
            logoUrl, imageUrl, address, city, zipCode,
            latitude, longitude, phone, email, website,
            advantages, pointsRequired, discount, isActive, isFeatured
        } = req.body;

        if (!name || !slug || !category || !address || !city || !zipCode) {
            return res.status(400).json({ error: 'Champs requis manquants (name, slug, category, address, city, zipCode)' });
        }

        const id = `partner-${Date.now()}`;
        const advantagesJson = Array.isArray(advantages) ? JSON.stringify(advantages) : (advantages || '[]');

        await pool.query(
            `INSERT INTO partners (id, name, slug, description, longDescription, category,
             logoUrl, imageUrl, address, city, zipCode, latitude, longitude,
             phone, email, website, advantages, pointsRequired, discount, isActive, isFeatured, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, name, slug, description, longDescription, category,
             logoUrl, imageUrl, address, city, zipCode, latitude || null, longitude || null,
             phone, email, website, advantagesJson, pointsRequired || null, discount,
             isActive !== false ? 1 : 0, isFeatured === true ? 1 : 0]
        );
        res.status(201).json({ id, message: 'Partenaire créé avec succès' });
    } catch (err) {
        console.error('Error creating partner:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT update partner
router.put('/api/partners/:id', async (req, res) => {
    try {
        const { 
            name, slug, description, longDescription, category, 
            logoUrl, imageUrl, address, city, zipCode, 
            latitude, longitude, phone, email, website, 
            advantages, pointsRequired, discount, isActive, isFeatured 
        } = req.body;
        
        const advantagesJson = Array.isArray(advantages) ? JSON.stringify(advantages) : advantages;
        
        const [result] = await pool.query(
            `UPDATE partners SET 
             name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description),
             longDescription = COALESCE(?, longDescription), category = COALESCE(?, category),
             logoUrl = ?, imageUrl = ?, address = COALESCE(?, address), city = COALESCE(?, city),
             zipCode = COALESCE(?, zipCode), latitude = ?, longitude = ?,
             phone = ?, email = ?, website = ?, advantages = COALESCE(?, advantages),
             pointsRequired = ?, discount = ?, isActive = COALESCE(?, isActive), 
             isFeatured = COALESCE(?, isFeatured), updatedAt = NOW() 
             WHERE id = ?`,
            [name, slug, description, longDescription, category,
             logoUrl, imageUrl, address, city, zipCode, latitude, longitude,
             phone, email, website, advantagesJson, pointsRequired, discount,
             isActive !== undefined ? (isActive ? 1 : 0) : null,
             isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
             req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Partenaire non trouvé' });
        }
        res.json({ message: 'Partenaire mis à jour' });
    } catch (err) {
        console.error('Error updating partner:', err);
        res.status(500).json({ error: 'Erreur serveur' });
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
        console.error('Error deleting partner:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
