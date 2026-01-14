const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

// GET all stats
router.get('/api/stats', async (req, res) => {
    try {
        // Count active bornes
        const [bornesResults] = await pool.query('SELECT COUNT(*) as count FROM bornes WHERE isActive = 1');

        // Count active partners
        const [partnersResults] = await pool.query('SELECT COUNT(*) as count FROM partners WHERE isActive = 1');

        // Count published articles
        const [articlesResults] = await pool.query('SELECT COUNT(*) as count FROM articles');

        // Count users (if table exists)
        let usersCount = 0;
        try {
            const [usersResults] = await pool.query('SELECT COUNT(*) as count FROM users');
            usersCount = usersResults[0].count;
        } catch (e) {
            // users table might not exist
        }

        // Get total glass collected from site_config (stored in tonnes, returned in kg)
        let totalGlassCollected = 0;
        try {
            const [configResults] = await pool.query("SELECT value FROM site_config WHERE `key` = 'total_glass_collected'");
            if (configResults.length > 0) {
                // La valeur est en tonnes, on la convertit en kg pour le frontend
                totalGlassCollected = parseFloat(configResults[0].value) * 1000 || 0;
            }
        } catch (e) {
            // site_config might not have this key
        }

        // Get total users from site_config
        let totalUsers = usersCount;
        try {
            const [configResults] = await pool.query("SELECT value FROM site_config WHERE `key` = 'total_users'");
            if (configResults.length > 0 && parseInt(configResults[0].value) > usersCount) {
                totalUsers = parseInt(configResults[0].value) || usersCount;
            }
        } catch (e) {
            // site_config might not have this key
        }

        res.json({
            totalBornes: bornesResults[0].count,
            totalPartners: partnersResults[0].count,
            totalArticles: articlesResults[0].count,
            totalUsers: totalUsers,
            totalGlassCollected: totalGlassCollected
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
