const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');

[uploadsDir, imagesDir, videosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isVideo = file.mimetype.startsWith('video/');
        cb(null, isVideo ? videosDir : imagesDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
    }
});

// File filter - accept images and videos
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Types acceptés: images (jpeg, png, gif, webp, svg) et vidéos (mp4, webm, ogg, mov)`), false);
    }
};

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max for videos
    }
});

// Single file upload endpoint
router.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier envoyé' });
        }

        const isVideo = req.file.mimetype.startsWith('video/');
        const subFolder = isVideo ? 'videos' : 'images';
        const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${subFolder}/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Fichier uploadé avec succès',
            file: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl,
                type: isVideo ? 'video' : 'image'
            }
        });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
    }
});

// Multiple files upload endpoint
router.post('/api/upload/multiple', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Aucun fichier envoyé' });
        }

        const uploadedFiles = req.files.map(file => {
            const isVideo = file.mimetype.startsWith('video/');
            const subFolder = isVideo ? 'videos' : 'images';
            return {
                filename: file.filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${subFolder}/${file.filename}`,
                type: isVideo ? 'video' : 'image'
            };
        });

        res.json({
            success: true,
            message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
            files: uploadedFiles
        });
    } catch (err) {
        console.error('Error uploading files:', err);
        res.status(500).json({ error: 'Erreur lors de l\'upload des fichiers' });
    }
});

// Delete file endpoint
router.delete('/api/upload/:type/:filename', (req, res) => {
    try {
        const { type, filename } = req.params;
        
        if (!['images', 'videos'].includes(type)) {
            return res.status(400).json({ error: 'Type invalide' });
        }
        
        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(uploadsDir, type, sanitizedFilename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }
        
        fs.unlinkSync(filePath);
        
        res.json({
            success: true,
            message: 'Fichier supprimé avec succès'
        });
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression du fichier' });
    }
});

// List uploaded files
router.get('/api/upload/list', (req, res) => {
    try {
        const { type } = req.query;
        const files = [];
        
        const readDir = (dir, fileType) => {
            if (fs.existsSync(dir)) {
                fs.readdirSync(dir).forEach(filename => {
                    const filePath = path.join(dir, filename);
                    const stats = fs.statSync(filePath);
                    files.push({
                        filename,
                        type: fileType,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${fileType}/${filename}`
                    });
                });
            }
        };

        if (!type || type === 'images') {
            readDir(imagesDir, 'images');
        }
        if (!type || type === 'videos') {
            readDir(videosDir, 'videos');
        }

        // Sort by creation date, newest first
        files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ files });
    } catch (err) {
        console.error('Error listing files:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des fichiers' });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'Le fichier est trop volumineux. Taille max: 50MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Trop de fichiers. Maximum: 10 fichiers'
            });
        }
        return res.status(400).json({ error: error.message });
    }

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    next();
});

module.exports = router;
