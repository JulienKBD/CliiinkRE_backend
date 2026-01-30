const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

// Helper function to ensure proper format for articles
const transformArticle = (article) => {
    if (!article) return null;
    return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        tags: article.tags ? (typeof article.tags === 'string' ? JSON.parse(article.tags) : article.tags) : [],
        imageUrl: article.imageUrl || null,
        isPublished: Boolean(article.isPublished),
        isFeatured: Boolean(article.isFeatured),
        publishedAt: article.publishedAt || null,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        authorId: article.authorId,
        authorName: article.authorName || null,
        views: article.views || 0
    };
};

// GET all articles (published only)
router.get('/api/articles', async (req, res) => {
    try {
        const { category, isFeatured, limit } = req.query;
        let query = 'SELECT * FROM articles WHERE isPublished = 1';
        const params = [];
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (isFeatured === 'true') {
            query += ' AND isFeatured = 1';
        }
        
        query += ' ORDER BY createdAt DESC';
        
        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }
        
        const [results] = await pool.query(query, params);
        res.json(results.map(transformArticle));
    } catch (err) {
        console.error('Error fetching articles:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET all articles for admin (including unpublished)
router.get('/api/articles/admin/all', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM articles ORDER BY createdAt DESC');
        res.json(results.map(transformArticle));
    } catch (err) {
        console.error('Error fetching articles:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET article categories with count
router.get('/api/articles/categories/list', async (req, res) => {
    try {
        const [results] = await pool.query(
            'SELECT category, COUNT(*) as count FROM articles WHERE isPublished = 1 GROUP BY category'
        );
        res.json(results);
    } catch (err) {
        console.error('Error fetching categories:', err);
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
        await pool.query('UPDATE articles SET views = views + 1 WHERE slug = ?', [req.params.slug]);
        res.json(transformArticle(results[0]));
    } catch (err) {
        console.error('Error fetching article:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET article by ID
router.get('/api/articles/:id', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }
        res.json(transformArticle(results[0]));
    } catch (err) {
        console.error('Error fetching article:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST create article
router.post('/api/articles', async (req, res) => {
    try {
        const { title, slug, content, excerpt, imageUrl, category, tags, isPublished, isFeatured, authorId, authorName } = req.body;
        
        const tagsJson = tags ? JSON.stringify(tags) : '[]';
        const now = new Date();
        const publishedAt = isPublished ? now : null;
        const id = 'article-' + Date.now();
        
        const insertQuery = 'INSERT INTO articles (id, title, slug, content, excerpt, imageUrl, category, tags, isPublished, isFeatured, publishedAt, authorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        
        await pool.query(insertQuery, [id, title, slug, content, excerpt, imageUrl, category, tagsJson, isPublished ? 1 : 0, isFeatured ? 1 : 0, publishedAt, authorId || 'cliiink-admin-001', now, now]);
        
        const [newArticle] = await pool.query('SELECT * FROM articles WHERE id = ?', [id]);
        res.status(201).json(transformArticle(newArticle[0]));
    } catch (err) {
        console.error('Error creating article:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT update article
router.put('/api/articles/:id', async (req, res) => {
    try {
        const { title, slug, content, excerpt, imageUrl, category, tags, isPublished, isFeatured } = req.body;
        
        const tagsJson = tags ? JSON.stringify(tags) : '[]';
        const now = new Date();
        
        const updateQuery = 'UPDATE articles SET title = ?, slug = ?, content = ?, excerpt = ?, imageUrl = ?, category = ?, tags = ?, isPublished = ?, isFeatured = ?, updatedAt = ? WHERE id = ?';
        
        const [result] = await pool.query(updateQuery, [title, slug, content, excerpt, imageUrl, category, tagsJson, isPublished ? 1 : 0, isFeatured ? 1 : 0, now, req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }
        
        const [updated] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);
        res.json(transformArticle(updated[0]));
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
