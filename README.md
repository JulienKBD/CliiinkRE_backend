# CliiinkRE Backend

API Express + MySQL pour le projet Cliiink Reunion.

## Description

Ce service expose les endpoints utilises par le site public et le dashboard admin:

- authentification
- gestion des bornes
- gestion des partenaires
- gestion des actualites
- gestion des messages de contact
- statistiques
- configuration applicative
- upload d'images/fichiers

## Stack technique

- Node.js + Express
- MySQL (mysql2)
- JWT (jsonwebtoken)
- Upload fichiers (multer)
- Email (nodemailer)

## Prerequis

- Node.js 18+
- npm
- MySQL 8+ (ou compatible)

## Installation

1. Installer les dependances

```bash
npm install
```

2. Creer un fichier `.env` a la racine du backend

```env
# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
SECRET=change-me
DEBUG=false

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=cliiink

# reCAPTCHA (optionnel en local)
RECAPTCHA_SECRET_KEY=

# Email (option 1: Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=cliiink@neogreen-oi.com

# Email (option 2: SMTP custom)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
```

3. Initialiser la base de donnees

```bash
# Exemple avec mysql CLI
mysql -u root -p cliiink < config/db.sql
```

## Lancement

Mode developpement:

```bash
npm run dev
```

Mode production:

```bash
npm start
```

Serveur par defaut: `http://localhost:3001`

Healthcheck: `GET /api/health`

## Scripts disponibles

- `npm run dev`: lance le serveur avec nodemon
- `npm start`: lance le serveur avec Node.js

## Endpoints principaux

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `PUT /api/auth/password`
- `GET|POST|PUT|DELETE /api/bornes...`
- `GET|POST|PUT|DELETE /api/partners...`
- `GET|POST|PUT|DELETE /api/articles...`
- `GET|POST|PUT|DELETE /api/contact...`
- `GET|POST /api/stats...`
- `GET|POST|PUT|DELETE /api/config...`
- `POST /api/upload` et endpoints associes (routes/upload)

## Arborescence

```text
CliiinkRE_backend/
|- config/
|- middlewares/
|- routes/
|- utils/
|- server.js
|- package.json
```

## Notes

- Les fichiers uploades sont servis via `/uploads`.
- L'URL publique des uploads est construite avec `BACKEND_URL`.
- En local, si `RECAPTCHA_SECRET_KEY` est vide, la verification anti-spam est bypass dans le endpoint contact.

## Licence

Projet prive - Cliiink Reunion
