const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const nodemailer = require('nodemailer');

// Fonction pour vérifier le token reCAPTCHA (v2)
async function verifyRecaptcha(token) {
    if (!token) return { success: false };

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
        console.warn('reCAPTCHA secret key not configured');
        return { success: true }; // Bypass en dev si pas configuré
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${secretKey}&response=${token}`,
        });
        const data = await response.json();
        return { success: data.success };
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return { success: false };
    }
}

// GET all contact messages
router.get('/api/contact', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM contact_messages ORDER BY createdAt DESC');
        res.json(results);
    } catch (err) {
        console.error('Error fetching contact messages:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET contact message by id
router.get('/api/contact/:id', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching contact message:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST create contact message
router.post('/api/contact', async (req, res) => {
    try {
        const { type, name, email, message, companyName, phone, position, recaptchaToken } = req.body;

        // Vérifier le reCAPTCHA
        const recaptchaResult = await verifyRecaptcha(recaptchaToken);
        if (!recaptchaResult.success) {
            console.warn('reCAPTCHA verification failed:', recaptchaResult);
            return res.status(400).json({ error: 'Vérification anti-spam échouée. Veuillez cocher la case "Je ne suis pas un robot".' });
        }

        const id = `msg-${Date.now()}`;
        const [result] = await pool.query(
            'INSERT INTO contact_messages (id, type, name, email, message, companyName, phone, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, type || 'PARTICULIER', name, email, message, companyName || null, phone || null, position || null]
        );
        res.status(201).json({ id, message: 'Message envoyé avec succès' });
    } catch (err) {
        console.error('Error creating contact message:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT update contact message (mark as read)
router.put('/api/contact/:id/read', async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE contact_messages SET isRead = TRUE WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }
        res.json({ message: 'Message marqué comme lu' });
    } catch (err) {
        console.error('Error updating contact message:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT archive contact message
router.put('/api/contact/:id/archive', async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE contact_messages SET isArchived = TRUE WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }
        res.json({ message: 'Message archivé' });
    } catch (err) {
        console.error('Error archiving contact message:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE contact message
router.delete('/api/contact/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }
        res.json({ message: 'Message supprimé' });
    } catch (err) {
        console.error('Error deleting contact message:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Configuration nodemailer
const createTransporter = () => {
    // Configuration pour différents services
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD // App password pour Gmail
            }
        });
    } else if (process.env.SMTP_HOST) {
        return nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    } else {
        // Configuration par défaut pour tests (Ethereal ou similaire)
        return nodemailer.createTransporter({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: 'ethereal.user@ethereal.email',
                pass: 'ethereal.pass'
            }
        });
    }
};

// POST send reply to contact message
router.post('/api/contact/:id/reply', async (req, res) => {
    try {
        const { subject, message, replyTo } = req.body;
        
        if (!subject || !message) {
            return res.status(400).json({ error: 'Sujet et message requis' });
        }

        // Récupérer les informations du message original
        const [results] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }

        const originalMessage = results[0];
        
        // Créer le transporteur email
        const transporter = createTransporter();

        // Configuration de l'email
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'cliiink@neogreen-oi.com',
            to: originalMessage.email,
            subject: subject,
            text: message,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #78d8a3 0%, #4ade80 100%); color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">Cliiink Réunion</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Réponse à votre message</p>
                    </div>
                    
                    <div style="padding: 30px; background: #ffffff;">
                        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                            Bonjour ${originalMessage.name},
                        </p>
                        
                        <div style="background: #f9fafb; border-left: 4px solid #78d8a3; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 600;">Votre message :</p>
                            <p style="margin: 10px 0 0 0; color: #374151; font-style: italic;">"${originalMessage.message.substring(0, 200)}${originalMessage.message.length > 200 ? '...' : ''}"</p>
                        </div>
                        
                        <div style="color: #374151; line-height: 1.6;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">
                                Cordialement,<br>
                                <strong>L'équipe Cliiink Réunion</strong>
                            </p>
                        </div>
                    </div>
                    
                    <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                        <p style="margin: 0;">
                            Cliiink Réunion - Recyclage du verre<br>
                            2 rue Pierre Marinier, 97438 Sainte-Marie<br>
                            📞 0262 01 02 17 | 📧 cliiink@neogreen-oi.com
                        </p>
                    </div>
                </div>
            `,
            replyTo: replyTo || process.env.EMAIL_FROM || 'cliiink@neogreen-oi.com'
        };

        // Envoyer l'email
        const info = await transporter.sendMail(mailOptions);
        
        // Marquer le message comme lu s'il ne l'était pas déjà
        if (!originalMessage.isRead) {
            await pool.query('UPDATE contact_messages SET isRead = TRUE WHERE id = ?', [req.params.id]);
        }

        console.log('Email sent:', info.messageId);
        res.json({ 
            message: 'Réponse envoyée avec succès',
            messageId: info.messageId 
        });

    } catch (err) {
        console.error('Error sending reply:', err);
        res.status(500).json({ error: 'Erreur lors de l\'envoi de la réponse' });
    }
});

module.exports = router;
