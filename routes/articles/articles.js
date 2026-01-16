const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

// GET all articles (with optional filters)
router.get('/api/articles', async (req, res) => {
    try {
        const { category, isFeatured, limit } = req.query;

        let query = 'SELECT * FROM articles WHERE 1=1';
        const params = [];

        // Filter by category
        if (category && category !== 'ALL') {
            query += ' AND category = ?';
            params.push(category);
        }

        // Filter by isFeatured
        if (isFeatured !== undefined) {
            query += ' AND isFeatured = ?';
            params.push(isFeatured === 'true' ? 1 : 0);
        }

        // Order by date
        query += ' ORDER BY createdAt DESC';

        // Limit results
        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit, 10));
        }

        const [results] = await pool.query(query, params);
        res.json(results);
    } catch (err) {
        console.error('Error fetching articles:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET all articles for admin (including drafts)
router.get('/api/articles/admin/all', async (req, res) => {
    try {
        const [results] = await pool.query(`
            SELECT a.*, u.name as authorName 
            FROM articles a 
            LEFT JOIN users u ON a.authorId = u.id 
            ORDER BY a.createdAt DESC
        `);
        res.json(results);
    } catch (err) {
        console.error('Error fetching articles for admin:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET article by ID (for admin)
router.get('/api/articles/id/:id', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching article by id:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET article by slug
router.get('/api/articles/slug/:slug', async (req, res) => {
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
        const { title, slug, excerpt, content, imageUrl, category, tags, isPublished, isFeatured, authorId } = req.body;
        
        if (!title || !slug || !content || !category || !authorId) {
            return res.status(400).json({ error: 'Champs requis manquants (title, slug, content, category, authorId)' });
        }
        
        const id = `article-${Date.now()}`;
        const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : (tags || '[]');
        const publishedAt = isPublished ? new Date().toISOString() : null;
        
        await pool.query(
            `INSERT INTO articles (id, title, slug, excerpt, content, imageUrl, category, tags, isPublished, isFeatured, publishedAt, authorId, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, title, slug, excerpt, content, imageUrl, category, tagsJson, 
             isPublished ? 1 : 0, isFeatured ? 1 : 0, publishedAt, authorId]
        );
        res.status(201).json({ id, message: 'Article créé avec succès' });
    } catch (err) {
        console.error('Error creating article:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT update article
router.put('/api/articles/:id', async (req, res) => {
    try {
        const { title, slug, excerpt, content, imageUrl, category, tags, isPublished, isFeatured } = req.body;
        
        const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : tags;
        const publishedAt = isPublished ? new Date().toISOString() : null;
        
        const [result] = await pool.query(
            `UPDATE articles SET 
             title = COALESCE(?, title), slug = COALESCE(?, slug), excerpt = ?,
             content = COALESCE(?, content), imageUrl = ?, category = COALESCE(?, category),
             tags = COALESCE(?, tags), isPublished = COALESCE(?, isPublished), 
             isFeatured = COALESCE(?, isFeatured), publishedAt = COALESCE(?, publishedAt),
             updatedAt = NOW() 
             WHERE id = ?`,
            [title, slug, excerpt, content, imageUrl, category, tagsJson,
             isPublished !== undefined ? (isPublished ? 1 : 0) : null,
             isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
             publishedAt, req.params.id]
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
