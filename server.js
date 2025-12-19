const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require('dotenv').config();

// Middlewares
const loggingMiddleware = require('./middlewares/login.js');
const corsMiddleware = require('./middlewares/cors.js');
const notFound = require('./middlewares/notFound.js');
const { authenticateToken, isAdmin } = require('./middlewares/auth.js');

// Routes
const authRoutes = require('./routes/auth/auth.js');
const bornesRoutes = require('./routes/bornes/bornes.js');
const partnersRoutes = require('./routes/partners/partners.js');
const articlesRoutes = require('./routes/articles/articles.js');
const contactRoutes = require('./routes/contact/contact.js');
const statsRoutes = require('./routes/stats/stats.js');
const configRoutes = require('./routes/config/config.js');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(corsMiddleware);
app.use(loggingMiddleware);

// ============================================
// API Routes
// ============================================

// Authentication
app.post('/api/auth/login', authRoutes);
app.post('/api/auth/register', authRoutes);
app.get('/api/auth/me', authRoutes);
app.put('/api/auth/password', authRoutes);

// Bornes
app.get('/api/bornes', bornesRoutes);
app.get('/api/bornes/stats/summary', bornesRoutes);
app.get('/api/bornes/cities/list', bornesRoutes);
app.get('/api/bornes/:id', bornesRoutes);
app.post('/api/bornes', bornesRoutes);
app.put('/api/bornes/:id', bornesRoutes);
app.delete('/api/bornes/:id', bornesRoutes);

// Partners
app.use('/api/partners', partnersRoutes);

// Articles
app.get('/api/articles', articlesRoutes);
app.get('/api/articles/admin/all', articlesRoutes);
app.get('/api/articles/categories/list', articlesRoutes);
app.get('/api/articles/slug/:slug', articlesRoutes);
app.get('/api/articles/:id', articlesRoutes);
app.post('/api/articles', articlesRoutes);
app.put('/api/articles/:id', articlesRoutes);
app.delete('/api/articles/:id', articlesRoutes);

// Contact
app.get('/api/contact', contactRoutes);
app.get('/api/contact/stats/summary', contactRoutes);
app.get('/api/contact/:id', contactRoutes);
app.post('/api/contact', contactRoutes);
app.put('/api/contact/:id/read', contactRoutes);
app.put('/api/contact/:id/archive', contactRoutes);
app.delete('/api/contact/:id', contactRoutes);

// Stats
app.get('/api/stats', statsRoutes);
app.get('/api/stats/monthly', statsRoutes);
app.get('/api/stats/by-city', statsRoutes);
app.post('/api/stats/monthly', statsRoutes);

// Config
app.get('/api/config', configRoutes);
app.get('/api/config/:key', configRoutes);
app.put('/api/config/:key', configRoutes);
app.post('/api/config', configRoutes);
app.delete('/api/config/:key', configRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Cliiink API is running' });
});

// 404 Not Found
app.use(notFound);

app.listen(port, () => {
    console.log(`🚀 Cliiink API Server is running on http://localhost:${port}`);
});
