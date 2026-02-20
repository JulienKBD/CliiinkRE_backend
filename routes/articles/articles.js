const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { createLogger } = require('../../utils/logger');
const log = createLogger('ARTICLES');

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
    log.request(req);
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

        log.debug('Query:', query, 'Params:', params);
        const [results] = await pool.query(query, params);
        log.success(req, 200, `${results.length} article(s) retourné(s)`);
        res.json(results.map(transformArticle));
    } catch (err) {
        log.error(req, err, 'Erreur récupération articles');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET all articles for admin (including unpublished)
router.get('/api/articles/admin/all', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query('SELECT * FROM articles ORDER BY createdAt DESC');
        log.success(req, 200, `${results.length} article(s) admin retourné(s)`);
        res.json(results.map(transformArticle));
    } catch (err) {
        log.error(req, err, 'Erreur récupération articles admin');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET article categories with count
router.get('/api/articles/categories/list', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query(
            'SELECT category, COUNT(*) as count FROM articles WHERE isPublished = 1 GROUP BY category'
        );
        log.success(req, 200, `${results.length} catégorie(s)`);
        res.json(results);
    } catch (err) {
        log.error(req, err, 'Erreur récupération catégories');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET article by slug
router.get('/api/articles/slug/:slug', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query('SELECT * FROM articles WHERE slug = ?', [req.params.slug]);
        if (results.length === 0) {
            log.warn(`Article non trouvé avec slug: ${req.params.slug}`);
            return res.status(404).json({ error: 'Article non trouvé' });
        }
        await pool.query('UPDATE articles SET views = views + 1 WHERE slug = ?', [req.params.slug]);
        log.success(req, 200, `Article "${results[0].title}" (views +1)`);
        res.json(transformArticle(results[0]));
    } catch (err) {
        log.error(req, err, `Erreur récupération article slug=${req.params.slug}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET article by ID
router.get('/api/articles/:id', async (req, res) => {
    log.request(req);
    try {
        const [results] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            log.warn(`Article non trouvé avec id: ${req.params.id}`);
            return res.status(404).json({ error: 'Article non trouvé' });
        }
        log.success(req, 200, `Article "${results[0].title}"`);
        res.json(transformArticle(results[0]));
    } catch (err) {
        log.error(req, err, `Erreur récupération article id=${req.params.id}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST create article
router.post('/api/articles', async (req, res) => {
    log.request(req);
    try {
        const { title, slug, content, excerpt, imageUrl, category, tags, isPublished, isFeatured, authorId, authorName } = req.body;

        const tagsJson = tags ? JSON.stringify(tags) : '[]';
        const now = new Date();
        const publishedAt = isPublished ? now : null;
        const id = 'article-' + Date.now();

        log.info(`Création article: "${title}" (slug: ${slug}, catégorie: ${category}, publié: ${isPublished})`);

        const insertQuery = 'INSERT INTO articles (id, title, slug, content, excerpt, imageUrl, category, tags, isPublished, isFeatured, publishedAt, authorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        await pool.query(insertQuery, [id, title, slug, content, excerpt, imageUrl, category, tagsJson, isPublished ? 1 : 0, isFeatured ? 1 : 0, publishedAt, authorId || 'cliiink-admin-001', now, now]);

        const [newArticle] = await pool.query('SELECT * FROM articles WHERE id = ?', [id]);
        log.success(req, 201, `Article créé avec id: ${id}`);
        res.status(201).json(transformArticle(newArticle[0]));
    } catch (err) {
        log.error(req, err, `Erreur création article "${req.body.title || '?'}"`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT update article
router.put('/api/articles/:id', async (req, res) => {
    log.request(req);
    try {
        const { title, slug, content, excerpt, imageUrl, category, tags, isPublished, isFeatured } = req.body;

        const tagsJson = tags ? JSON.stringify(tags) : '[]';
        const now = new Date();

        log.info(`Mise à jour article id=${req.params.id}: "${title}"`);

        const updateQuery = 'UPDATE articles SET title = ?, slug = ?, content = ?, excerpt = ?, imageUrl = ?, category = ?, tags = ?, isPublished = ?, isFeatured = ?, updatedAt = ? WHERE id = ?';

        const [result] = await pool.query(updateQuery, [title, slug, content, excerpt, imageUrl, category, tagsJson, isPublished ? 1 : 0, isFeatured ? 1 : 0, now, req.params.id]);

        if (result.affectedRows === 0) {
            log.warn(`Article non trouvé pour mise à jour: id=${req.params.id}`);
            return res.status(404).json({ error: 'Article non trouvé' });
        }

        const [updated] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);
        log.success(req, 200, `Article mis à jour: id=${req.params.id}`);
        res.json(transformArticle(updated[0]));
    } catch (err) {
        log.error(req, err, `Erreur mise à jour article id=${req.params.id}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE article
router.delete('/api/articles/:id', async (req, res) => {
    log.request(req);
    try {
        const [result] = await pool.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            log.warn(`Article non trouvé pour suppression: id=${req.params.id}`);
            return res.status(404).json({ error: 'Article non trouvé' });
        }
        log.success(req, 200, `Article supprimé: id=${req.params.id}`);
        res.json({ message: 'Article supprimé' });
    } catch (err) {
        log.error(req, err, `Erreur suppression article id=${req.params.id}`);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
