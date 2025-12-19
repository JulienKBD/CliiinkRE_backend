const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

// GET all articles
router.get('/api/articles', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM articles ORDER BY createdAt DESC');
        res.json(results);
    } catch (err) {
        console.error('Error fetching articles:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET article by slug
router.get('/api/articles/:slug', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM articles WHERE slug = ?', [req.params.slug]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching article:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST create article
router.post('/api/articles', async (req, res) => {
    try {
        const { title, slug, content, excerpt, image_url, category } = req.body;
        const [result] = await pool.query(
            'INSERT INTO articles (title, slug, content, excerpt, image_url, category) VALUES (?, ?, ?, ?, ?, ?)',
            [title, slug, content, excerpt, image_url, category]
        );
        res.status(201).json({ id: result.insertId, message: 'Article créé' });
    } catch (err) {
        console.error('Error creating article:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT update article
router.put('/api/articles/:id', async (req, res) => {
    try {
        const { title, slug, content, excerpt, image_url, category } = req.body;
        const [result] = await pool.query(
            'UPDATE articles SET title = ?, slug = ?, content = ?, excerpt = ?, image_url = ?, category = ? WHERE id = ?',
            [title, slug, content, excerpt, image_url, category, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }
        res.json({ message: 'Article mis à jour' });
    } catch (err) {
        console.error('Error updating article:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE article
router.delete('/api/articles/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }
        res.json({ message: 'Article supprimé' });
    } catch (err) {
        console.error('Error deleting article:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
