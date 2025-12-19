const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

// GET all stats
router.get('/api/stats', async (req, res) => {
    try {
        const [bornesResults] = await pool.query('SELECT COUNT(*) as count FROM bornes');
        const [partnersResults] = await pool.query('SELECT COUNT(*) as count FROM partners');
        const [articlesResults] = await pool.query('SELECT COUNT(*) as count FROM articles');
        const [messagesResults] = await pool.query('SELECT COUNT(*) as count FROM contact_messages');

        res.json({
            bornes: bornesResults[0].count,
            partners: partnersResults[0].count,
            articles: articlesResults[0].count,
            messages: messagesResults[0].count
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
