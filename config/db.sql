-- ============================================
-- BASE DE DONNÉES CLIIINK RÉUNION
-- MySQL 8.0+
-- ============================================

-- Assure que le client/connexion lit le fichier en utf8mb4
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET CHARACTER SET utf8mb4;

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS cliiink_re
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cliiink_re;

ALTER DATABASE cliiink_re
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ============================================
-- TABLES
-- ============================================

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(30) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role ENUM('ADMIN', 'EDITOR') DEFAULT 'ADMIN',
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Table des bornes de tri
CREATE TABLE IF NOT EXISTS bornes (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  zipCode VARCHAR(10) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  status ENUM('ACTIVE', 'MAINTENANCE', 'FULL', 'INACTIVE') DEFAULT 'ACTIVE',
  capacity INT,
  fillLevel INT,
  lastCollected DATETIME(3),
  description TEXT,
  imageUrl VARCHAR(500),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Table des partenaires
CREATE TABLE IF NOT EXISTS partners (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  longDescription LONGTEXT,
  category ENUM('RESTAURANT', 'BAR', 'CAFE', 'BOUTIQUE', 'SUPERMARCHE', 'LOISIRS', 'BEAUTE', 'SERVICES', 'AUTRE') NOT NULL,
  logoUrl VARCHAR(500),
  imageUrl VARCHAR(500),
  address VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  zipCode VARCHAR(10) NOT NULL,
  latitude DOUBLE,
  longitude DOUBLE,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(500),
  advantages TEXT NOT NULL,
  pointsRequired INT,
  discount VARCHAR(100),
  isActive BOOLEAN DEFAULT TRUE,
  isFeatured BOOLEAN DEFAULT FALSE,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Table des articles
CREATE TABLE IF NOT EXISTS articles (
  id VARCHAR(30) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt VARCHAR(300),
  content LONGTEXT NOT NULL,
  imageUrl VARCHAR(500),
  category ENUM('EVENEMENT', 'TRI', 'PARTENAIRES', 'RESULTATS', 'ACTUALITE', 'CONSEILS') NOT NULL,
  tags TEXT NOT NULL,
  isPublished BOOLEAN DEFAULT FALSE,
  isFeatured BOOLEAN DEFAULT FALSE,
  publishedAt DATETIME(3),
  views INT DEFAULT 0,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  authorId VARCHAR(30) NOT NULL,
  FOREIGN KEY (authorId) REFERENCES users(id)
);

-- Table des messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
  id VARCHAR(30) PRIMARY KEY,
  type ENUM('PARTICULIER', 'COMMERCANT') NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  attachmentUrl VARCHAR(500),
  companyName VARCHAR(255),
  phone VARCHAR(20),
  position VARCHAR(255),
  isRead BOOLEAN DEFAULT FALSE,
  isArchived BOOLEAN DEFAULT FALSE,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
);

-- Table de configuration du site
CREATE TABLE IF NOT EXISTS site_config (
  id VARCHAR(30) PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description VARCHAR(500),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Table des statistiques
CREATE TABLE IF NOT EXISTS statistics (
  id VARCHAR(30) PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL,
  totalGlassCollected DOUBLE NOT NULL,
  totalPoints INT NOT NULL,
  totalUsers INT NOT NULL,
  totalPartners INT NOT NULL,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY unique_year_month (year, month)
);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Utilisateur admin (mot de passe: Admin123!)
-- Hash bcrypt pour 'Admin123!'
INSERT INTO users (id, email, password, name, role, createdAt, updatedAt) VALUES
('cliiink-admin-001', 'admin@cliiink-reunion.re', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4aoHi.nMBhWOqmKi', 'Administrateur', 'ADMIN', NOW(), NOW());

-- ============================================
-- BORNES DE TRI (90 bornes - données Neogreen)
-- ============================================
INSERT INTO bornes (id, name, address, city, zipCode, latitude, longitude, status, description, createdAt, updatedAt) VALUES
('borne-001', 'Rue Azema', 'Rue Azema', 'Bras-Panon', '97412', -20.980832, 55.642729, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-002', 'Chemin Bellevue', 'Chemin Bellevue', 'Bras-Panon', '97412', -20.983749, 55.643053, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-003', 'Chemin Notre-Dame du Rosaire', 'Chemin Notre-Dame du Rosaire', 'Bras-Panon', '97412', -20.988631, 55.632164, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-004', 'Rue du Temple', 'Rue du Temple', 'Bras-Panon', '97412', -20.984611, 55.653737, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-005', 'Chemin Bras Petard', 'Chemin Bras Petard', 'Bras-Panon', '97412', -21.002633, 55.671019, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-006', 'Rue du 20 Decembre', 'Rue du 20 Decembre', 'Bras-Panon', '97412', -20.994822, 55.677669, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-007', 'Rue des Becs Roses', 'Rue des Becs Roses', 'Bras-Panon', '97412', -20.99386, 55.682352, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-008', 'Rue Roger Vidot', 'Rue Roger Vidot', 'Bras-Panon', '97412', -20.99819, 55.676643, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-009', 'Intersection Rue des Corbeilles d''Or / Impasse Amethyste', 'Intersection Rue des Corbeilles d''Or / Impasse Amethyste', 'Bras-Panon', '97412', -20.999806, 55.691392, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-010', 'Rue François Roland', 'Rue François Roland', 'Bras-Panon', '97412', -21.00254, 55.700034, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-011', 'Allee des Lotus', 'Allee des Lotus', 'Bras-Panon', '97412', -21.003263, 55.69193, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-012', 'Intersection Avenue du Vanillier / Rue des Avocatiers', 'Intersection Avenue du Vanillier / Rue des Avocatiers', 'Bras-Panon', '97412', -21.002514, 55.685178, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-013', 'Rue des Lilas - decheterie', 'Rue des Lilas - decheterie', 'Bras-Panon', '97412', -21.001746, 55.680184, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-014', 'Intersection chemin La Caroline / chemin Bras sec', 'intersection chemin La Caroline / chemin Bras sec', 'Bras-Panon', '97412', -20.999473, 55.654386, 'ACTIVE', 'Installation verre - Bras-Panon', NOW(), NOW()),
('borne-015', 'Rue Emilienne Maillot', 'Rue Emilienne Maillot', 'La Plaine-des-Palmistes', '97431', -21.122024, 55.642973, 'ACTIVE', 'Installation verre - La Plaine-des-Palmistes', NOW(), NOW()),
('borne-016', 'Rue du Commerce', 'Rue du Commerce', 'La Plaine-des-Palmistes', '97431', -21.1339, 55.626379, 'ACTIVE', 'Installation verre - La Plaine-des-Palmistes', NOW(), NOW()),
('borne-017', 'Avenue du Stade - Decheterie', 'Avenue du Stade - Decheterie', 'La Plaine-des-Palmistes', '97431', -21.131499, 55.620172, 'ACTIVE', 'Installation verre - La Plaine-des-Palmistes', NOW(), NOW()),
('borne-018', 'Rue de la Republique', 'Rue de la Republique', 'La Plaine-des-Palmistes', '97431', -21.152945, 55.610774, 'ACTIVE', 'Installation verre - La Plaine-des-Palmistes', NOW(), NOW()),
('borne-019', 'Rue Luc Boyer', 'Rue Luc Boyer', 'La Plaine-des-Palmistes', '97431', -21.137276, 55.605307, 'ACTIVE', 'Installation verre - La Plaine-des-Palmistes', NOW(), NOW()),
('borne-020', 'Chemin Bois Rouge', 'Chemin Bois Rouge', 'Saint-Andre', '97440', -20.930677, 55.644812, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-021', 'Ruelle des Orchidees', 'Ruelle des Orchidees', 'Saint-Andre', '97440', -20.932894, 55.65132, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-022', 'Parc Colosse', 'Parc Colosse', 'Saint-Andre', '97440', -20.928381, 55.660453, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-023', 'Chemin Champ Borne', 'Chemin Champ Borne', 'Saint-Andre', '97440', -20.940157, 55.67629, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-024', 'Rue Jean de la Fontaine (ZAC fayard)', 'Rue Jean de la Fontaine (ZAC fayard)', 'Saint-Andre', '97440', -20.940026, 55.663504, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-025', 'Chemin du Centre', 'Chemin du Centre', 'Saint-Andre', '97440', -20.946622, 55.655462, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-026', 'Lotissement Satec', 'Lotissement Satec', 'Saint-Andre', '97440', -20.944161, 55.669711, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-027', 'RD48', 'RD48', 'Saint-Andre', '97440', -20.943739, 55.681033, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-028', 'Chemin Lefaguyes', 'Chemin Lefaguyes', 'Saint-Andre', '97440', -20.960593, 55.662269, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-029', 'Chemin Rio', 'Chemin Rio', 'Saint-Andre', '97440', -20.953936, 55.67041, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-030', 'Chemin Agenor', 'Chemin Agenor', 'Saint-Andre', '97440', -20.950155, 55.686122, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-031', 'Chemin Grand Canal', 'Chemin Grand Canal', 'Saint-Andre', '97440', -20.957499, 55.688224, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-032', 'Lotissement Grand Pelvoisin', 'Lotissement Grand Pelvoisin', 'Saint-Andre', '97440', -20.975078, 55.69516, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-033', 'Intersection Rue des Longoses / Rue du Temple', 'Intersection Rue des Longoses / Rue du Temple', 'Saint-Andre', '97440', -20.966266, 55.668221, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-034', 'Rue des Flamboyants', 'Rue des Flamboyants', 'Saint-Andre', '97440', -20.970921, 55.658924, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-035', 'Rue des Longanis', 'Rue des Longanis', 'Saint-Andre', '97440', -20.975858, 55.657623, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-036', 'Chemin de la Chapelle', 'Chemin de la Chapelle', 'Saint-Andre', '97440', -20.949104, 55.649849, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-037', 'Rue Dumesgnil D''Engente', 'Rue Dumesgnil D''Engente', 'Saint-Andre', '97440', -20.954239, 55.654561, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-038', 'Rue Lacoaret', 'Rue Lacoaret', 'Saint-Andre', '97440', -20.957517, 55.654881, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-039', 'Rue du Stade', 'Rue du Stade', 'Saint-Andre', '97440', -20.956185, 55.647214, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-040', 'Lotissement les Feuillantines', 'Lotissement les Feuillantines', 'Saint-Andre', '97440', -20.963548, 55.645408, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-041', 'Chemin Lebon', 'chemin Lebon', 'Saint-Andre', '97440', -20.966719, 55.651676, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-042', 'Route du Pont', 'Route du Pont', 'Saint-Andre', '97440', -20.975355, 55.645962, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-043', 'Rue Maxime Laope', 'Rue Maxime Laope', 'Saint-Andre', '97440', -20.975187, 55.650686, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-044', 'Lotissement Soleil', 'Lotissement Soleil', 'Saint-Andre', '97440', -20.965833, 55.623322, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-045', 'Lotissement Diore', 'Lotissement Diore', 'Saint-Andre', '97440', -20.98309, 55.620054, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-046', 'Rue des Limites', 'Rue des Limites', 'Saint-Andre', '97440', -20.971926, 55.689978, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-047', 'Lot Caramboles', 'lot Caramboles', 'Saint-Andre', '97440', -20.965916, 55.647697, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-048', 'Rue de la Communaute', 'rue de la Communaute', 'Saint-Andre', '97440', -20.966993, 55.654866, 'ACTIVE', 'Installation verre - Saint-Andre', NOW(), NOW()),
('borne-049', 'Intersection Rue Georges Pompidou / Route de Bois de Pomme', 'Intersection Rue Georges Pompidou / Route de Bois de Pomme', 'Salazie', '97433', -21.026326, 55.539288, 'ACTIVE', 'Installation verre - Salazie', NOW(), NOW()),
('borne-050', 'Impasse Techer Appolidor', 'Impasse Techer Appolidor', 'Salazie', '97433', -21.06843, 55.521369, 'ACTIVE', 'Installation verre - Salazie', NOW(), NOW()),
('borne-051', 'Intersection Chemin Begue / Chemin de l''Aloes', 'Intersection Chemin Begue / Chemin de l''Aloes', 'Salazie', '97433', -21.028666, 55.50525, 'ACTIVE', 'Installation verre - Salazie', NOW(), NOW()),
('borne-052', 'Chemin du Cimetiere', 'Chemin du Cimetiere', 'Salazie', '97433', -21.029397, 55.476397, 'ACTIVE', 'Installation verre - Salazie', NOW(), NOW()),
('borne-053', 'Au niveau du CASE', 'au niveau du CASE', 'Salazie', '97433', -21.03666, 55.532754, 'ACTIVE', 'Installation verre - Salazie', NOW(), NOW()),
('borne-054', 'Route du Telepherique', 'route du Telepherique', 'Salazie', '97433', -21.051147, 55.530072, 'ACTIVE', 'Installation verre - Salazie', NOW(), NOW()),
('borne-055', 'Lotissement Chay-Pac-Thing', 'Lotissement Chay-Pac-Thing', 'Saint-Benoit', '97470', -21.011164, 55.693196, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-056', 'Route Nationale 2 Site de la Cabane', 'Route Nationale 2 Site de la Cabane', 'Saint-Benoit', '97470', -21.016154, 55.700573, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-057', 'Intersection Lotissement Oree / Rue Antoine Chauvet', 'Intersection Lotissement Oree / Rue Antoine Chauvet', 'Saint-Benoit', '97470', -21.029615, 55.706245, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-058', 'Rue du Stade de l''Ilet', 'Rue du Stade de l''Ilet', 'Saint-Benoit', '97470', -21.034012, 55.716295, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-059', 'Chemin Goyave', 'Chemin Goyave', 'Saint-Benoit', '97470', -21.036412, 55.705612, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-060', 'Chemin Manes', 'Chemin Manes', 'Saint-Benoit', '97470', -21.034152, 55.69931, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-061', 'Av Jean Jaures / Rue Pierre Leproux', 'Av Jean Jaures / Rue Pierre Leproux', 'Saint-Benoit', '97470', -21.039851, 55.719178, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-062', 'Zone des Tamarins', 'Zone des Tamarins', 'Saint-Benoit', '97470', -21.052184, 55.716907, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-063', 'Rue Du Stade Jean Allane', 'Rue Du Stade jean allane', 'Saint-Benoit', '97470', -21.044609, 55.716127, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-064', 'Route Nationale 2 (Saint-Benoit)', 'route nationale 2', 'Saint-Benoit', '97470', -21.076194, 55.741284, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-065', 'Chemin de Cap', 'Chemin de Cap', 'Saint-Benoit', '97470', -21.070097, 55.73406, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-066', 'Chemin Bassin Bleu', 'Chemin Bassin Bleu', 'Saint-Benoit', '97470', -21.082422, 55.747523, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-067', 'Chemin Morange - Decheterie Sainte-Anne', 'Chemin Morange - Decheterie Sainte-Anne', 'Saint-Benoit', '97470', -21.087198, 55.742756, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-068', 'Pont Riviere de l''Est', 'Pont Riviere de l''Est', 'Saint-Benoit', '97470', -21.122407, 55.74661, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-069', 'Chemin Bellier', 'Chemin Bellier', 'Saint-Benoit', '97470', -21.028221, 55.687334, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-070', 'Intersection Chemin l''Abondance', 'Intersection Chemin l''Abondance', 'Saint-Benoit', '97470', -21.034487, 55.676382, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-071', 'Chemin David Moreau', 'chemin David Moreau', 'Saint-Benoit', '97470', -21.050004, 55.7146, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-072', 'Rue Le Corbusier', 'rue Le Corbusier', 'Saint-Benoit', '97470', -21.052479, 55.712924, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-073', 'Chemin Prevoisy', 'Chemin Prevoisy', 'Saint-Benoit', '97470', -21.050813, 55.70555, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-074', 'Intersection Chemin Bras Madeleine / Rue Maurice Sautron', 'Intersection Chemin Bras Madeleine / rue Maurice Sautron', 'Saint-Benoit', '97470', -21.056452, 55.698042, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-075', 'Allee des Vergers', 'Allee des Vergers', 'Saint-Benoit', '97470', -21.068949, 55.704014, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-076', 'Rue des Ravenales', 'Rue des Ravenales', 'Saint-Benoit', '97470', -21.079974, 55.695377, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-077', 'Chemin des Azalees', 'Chemin des Azalees', 'Saint-Benoit', '97470', -21.112193, 55.725188, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-078', 'Rue des Capucines', 'Rue des Capucines', 'Saint-Benoit', '97470', -21.088692, 55.744957, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-079', 'Rue Françoise de Chatelain', 'Rue Françoise de Chatelain', 'Saint-Benoit', '97470', -21.045637, 55.723398, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-080', 'Rue des Quatre Epices', 'Rue des Quatre Epices', 'Saint-Benoit', '97470', -21.03916, 55.714203, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-081', 'Rue Palmier Royal', 'Rue Palmier Royal', 'Saint-Benoit', '97470', -21.029483, 55.703685, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-082', 'Angle rue Alexis de Villeneuve/rue Bertin', 'angle rue Alexis de Villeneuve/rue Bertin', 'Saint-Benoit', '97470', -21.031478, 55.71416, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-083', 'Parc Fragrance', 'Parc Fragrance', 'Saint-Benoit', '97470', -21.038527, 55.711311, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-084', 'Rue des Dahlias', 'rue des Dahlias', 'Saint-Benoit', '97470', -21.055076, 55.707208, 'ACTIVE', 'Installation verre - Saint-Benoit', NOW(), NOW()),
('borne-085', 'Chemin Isidore', 'Chemin Isidore', 'Sainte-Rose', '97439', -21.120876, 55.760606, 'ACTIVE', 'Installation verre - Sainte-Rose', NOW(), NOW()),
('borne-086', 'Nationale 2 (Sainte-Rose)', 'Nationale 2', 'Sainte-Rose', '97439', -21.128738, 55.793273, 'ACTIVE', 'Installation verre - Sainte-Rose', NOW(), NOW()),
('borne-087', 'Route Nationale 2 (Sainte-Rose)', 'Route Nationale 2', 'Sainte-Rose', '97439', -21.136095, 55.806242, 'ACTIVE', 'Installation verre - Sainte-Rose', NOW(), NOW()),
('borne-088', 'Decheterie Sainte-Rose', 'Decheterie', 'Sainte-Rose', '97439', -21.142217, 55.810848, 'ACTIVE', 'Installation verre - Sainte-Rose', NOW(), NOW()),
('borne-089', 'Route Nationale 2 (Sainte-Rose 2)', 'Route Nationale 2', 'Sainte-Rose', '97439', -21.161577, 55.823989, 'ACTIVE', 'Installation verre - Sainte-Rose', NOW(), NOW()),
('borne-090', 'Route Nationale 2 (Sainte-Rose 3)', 'Route Nationale 2', 'Sainte-Rose', '97439', -21.19667, 55.82054, 'ACTIVE', 'Installation verre - Sainte-Rose', NOW(), NOW());

-- ============================================
-- PARTENAIRES
-- ============================================
INSERT INTO partners (id, name, slug, description, longDescription, category, address, city, zipCode, latitude, longitude, phone, email, website, advantages, pointsRequired, discount, isActive, isFeatured, createdAt, updatedAt) VALUES
('partner-001', 'Le Comptoir Créole', 'le-comptoir-creole', 'Restaurant traditionnel réunionnais', 'Découvrez les saveurs authentiques de La Réunion dans ce restaurant familial. Cari, rougail, et spécialités locales vous attendent.', 'RESTAURANT', '45 Rue Pasteur', 'Saint-Denis', '97400', -20.8792, 55.4456, '0262 21 45 67', 'contact@comptoircreole.re', NULL, '["10% de réduction sur l''addition", "Apéritif offert"]', 100, '-10%', TRUE, TRUE, NOW(), NOW()),
('partner-002', 'Ti Punch Bar', 'ti-punch-bar', 'Bar ambiance tropicale', 'Le meilleur rhum arrangé de l''île ! Ambiance conviviale et musicale tous les weekends.', 'BAR', '12 Front de Mer', 'Saint-Pierre', '97410', -21.3401, 55.4789, '0262 35 78 90', NULL, NULL, '["1 Ti Punch offert pour 200 points", "Happy Hour prolongé"]', 200, '1 boisson offerte', TRUE, TRUE, NOW(), NOW()),
('partner-003', 'Boutique Vanille Bourbon', 'boutique-vanille-bourbon', 'Épicerie fine et produits locaux', 'Vanille, épices, confitures artisanales et produits du terroir réunionnais.', 'BOUTIQUE', '8 Rue du Commerce', 'Saint-Paul', '97460', -21.0098, 55.2715, '0262 22 33 44', NULL, 'https://vanille-bourbon.re', '["15% sur les achats", "Échantillon vanille offert"]', 150, '-15%', TRUE, TRUE, NOW(), NOW()),
('partner-004', 'Café des Îles', 'cafe-des-iles', 'Café torréfié localement', 'Café Bourbon pointu et autres variétés torréfiées sur place. Espace dégustation.', 'CAFE', '3 Place de l''Église', 'Sainte-Marie', '97438', -20.8975, 55.5350, '0262 53 21 00', NULL, NULL, '["Café offert", "10% sur les sachets de café"]', 50, 'Café offert', TRUE, FALSE, NOW(), NOW()),
('partner-005', 'Super U Saint-Denis', 'super-u-saint-denis', 'Supermarché partenaire', 'Votre supermarché de proximité, engagé dans la démarche éco-responsable.', 'SUPERMARCHE', 'Centre Commercial Californie', 'Saint-Denis', '97400', -20.8850, 55.4520, '0262 20 10 20', NULL, NULL, '["Bons de réduction", "5% de remise immédiate"]', 300, '5€ en bon d''achat', TRUE, FALSE, NOW(), NOW()),
('partner-006', 'Spa Lagon Bleu', 'spa-lagon-bleu', 'Centre de bien-être et spa', 'Massages, soins du corps, hammam et sauna dans un cadre relaxant.', 'BEAUTE', '20 Route des Plages', 'Saint-Gilles', '97434', -21.0667, 55.2167, '0262 24 56 78', NULL, 'https://spa-lagonbleu.re', '["20% sur le premier soin", "Accès hammam offert"]', 500, '-20%', TRUE, TRUE, NOW(), NOW());

-- ============================================
-- ARTICLES
-- ============================================
INSERT INTO articles (id, title, slug, excerpt, content, category, tags, isPublished, isFeatured, publishedAt, views, authorId, createdAt, updatedAt) VALUES
('article-001', 'Lancement de Cliiink à La Réunion !', 'lancement-cliiink-reunion', 'Le dispositif Cliiink arrive enfin sur notre île. Découvrez comment gagner des récompenses en triant vos bouteilles en verre.', '# Cliiink débarque à La Réunion !\n\nNous sommes fiers d''annoncer le lancement officiel du dispositif **Cliiink** sur l''île de La Réunion.\n\n## Comment ça marche ?\n\n1. **Téléchargez l''application** Cliiink sur votre smartphone\n2. **Déposez vos bouteilles en verre** dans une borne connectée\n3. **Cumulez des points** à chaque dépôt\n4. **Profitez de récompenses** chez nos partenaires\n\n## Les premières bornes\n\nDès aujourd''hui, **90 bornes** sont disponibles dans l''Est de l''île :\n- Bras-Panon (14 bornes)\n- La Plaine-des-Palmistes (5 bornes)\n- Saint-André (29 bornes)\n- Salazie (6 bornes)\n- Saint-Benoît (30 bornes)\n- Sainte-Rose (6 bornes)\n\n## Un geste écologique récompensé\n\nChaque bouteille compte ! En moyenne, un foyer réunionnais consomme plus de **100 bouteilles en verre par an**. Avec Cliiink, ce geste de tri devient doublement gagnant : pour la planète et pour votre portefeuille.\n\n*Rejoignez le mouvement et commencez à cumuler des points dès aujourd''hui !*', 'ACTUALITE', '["lancement", "cliiink", "réunion", "tri"]', TRUE, TRUE, '2024-11-15 00:00:00', 0, 'cliiink-admin-001', NOW(), NOW()),
('article-002', 'Nos partenaires commerçants vous récompensent', 'partenaires-commercants-recompenses', 'Plus de 20 commerçants locaux vous offrent des réductions exclusives grâce à vos points Cliiink.', '# Découvrez nos partenaires\n\nLes commerçants réunionnais s''engagent avec Cliiink pour récompenser vos gestes éco-responsables.\n\n## Des avantages exclusifs\n\nRestaurants, bars, boutiques, supermarchés... Nos partenaires vous proposent :\n\n- **Réductions** sur vos achats (de 5% à 20%)\n- **Cadeaux** et produits offerts\n- **Expériences** uniques (spa, loisirs...)\n\n## Comment utiliser vos points ?\n\n1. Consultez la liste des partenaires sur notre site ou l''application\n2. Choisissez l''offre qui vous plaît\n3. Présentez votre QR code en caisse\n4. Profitez de votre récompense !\n\n## Rejoignez notre réseau de partenaires\n\nVous êtes commerçant et souhaitez rejoindre l''aventure Cliiink ? Contactez-nous pour en savoir plus sur les conditions de partenariat.', 'PARTENAIRES', '["partenaires", "récompenses", "commerçants"]', TRUE, TRUE, '2024-11-20 00:00:00', 0, 'cliiink-admin-001', NOW(), NOW()),
('article-003', '10 conseils pour bien trier le verre', '10-conseils-bien-trier-verre', 'Adoptez les bons réflexes pour un tri efficace et maximisez vos points Cliiink.', '# 10 conseils pour bien trier le verre\n\nLe tri du verre, c''est simple ! Suivez ces conseils pour devenir un pro du recyclage.\n\n## ✅ Ce qui va dans la borne\n\n1. **Bouteilles** de vin, bière, jus de fruits\n2. **Pots** de confiture, moutarde\n3. **Bocaux** en verre\n4. **Flacons** de parfum (vidés)\n\n## ❌ Ce qu''il faut éviter\n\n5. **Vaisselle** en verre (assiettes, verres)\n6. **Miroirs** et vitres\n7. **Ampoules** (déchetterie)\n8. **Céramique** et porcelaine\n\n## 💡 Astuces bonus\n\n9. **Inutile de rincer** : un simple égouttage suffit\n10. **Retirez les bouchons** en métal ou plastique\n\n## Le saviez-vous ?\n\nLe verre est recyclable **à l''infini** ! Une bouteille recyclée peut redevenir une bouteille en seulement 30 jours.\n\n*Avec Cliiink, chaque geste compte et rapporte !*', 'CONSEILS', '["conseils", "tri", "verre", "recyclage"]', TRUE, FALSE, '2024-11-25 00:00:00', 0, 'cliiink-admin-001', NOW(), NOW()),
('article-004', 'Résultats du premier mois : 5 tonnes de verre collectées !', 'resultats-premier-mois-5-tonnes', 'Un mois après le lancement, les Réunionnais ont déjà adopté le réflexe Cliiink.', '# Bilan du premier mois\n\nUn mois après le lancement, les chiffres sont encourageants !\n\n## Les résultats en chiffres\n\n- **5 tonnes** de verre collectées\n- **2 500** utilisateurs inscrits\n- **15 000** dépôts réalisés\n- **750 000** points distribués\n\n## Les champions du tri\n\nSaint-Benoît arrive en tête avec **35%** des dépôts, suivi de Saint-André (30%) et Bras-Panon (15%).\n\n## Objectifs pour les prochains mois\n\n- Installer **50 nouvelles bornes** dans l''Ouest et le Sud\n- Atteindre **10 000 utilisateurs**\n- Collecter **50 tonnes** de verre en 6 mois\n\n## Merci !\n\nUn grand merci à tous les participants et à nos partenaires pour leur engagement. Ensemble, faisons de La Réunion un modèle d''économie circulaire !', 'RESULTATS', '["résultats", "statistiques", "bilan"]', TRUE, TRUE, '2024-12-01 00:00:00', 0, 'cliiink-admin-001', NOW(), NOW());

-- ============================================
-- CONFIGURATION DU SITE
-- ============================================
INSERT INTO site_config (id, `key`, value, description, updatedAt) VALUES
('config-001', 'site_title', 'Cliiink Réunion - Triez, Gagnez, Préservez', 'Titre du site', NOW()),
('config-002', 'site_description', 'Cliiink Réunion : le dispositif de tri du verre qui vous récompense. Trouvez une borne, déposez vos bouteilles et gagnez des avantages chez nos partenaires.', 'Description SEO du site', NOW()),
('config-003', 'hero_title', 'Triez votre verre, gagnez des récompenses', 'Titre du hero banner', NOW()),
('config-004', 'hero_subtitle', 'Avec Cliiink, chaque bouteille déposée vous rapporte des points échangeables chez nos partenaires réunionnais.', 'Sous-titre du hero banner', NOW()),
('config-005', 'total_glass_collected', '5.2', 'Total de verre collecté en tonnes', NOW()),
('config-006', 'total_users', '2847', 'Nombre total d''utilisateurs', NOW()),
('config-007', 'total_partners', '24', 'Nombre de partenaires', NOW());

-- ============================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- ============================================
CREATE INDEX idx_bornes_city ON bornes(city);
CREATE INDEX idx_bornes_status ON bornes(status);
CREATE INDEX idx_bornes_isActive ON bornes(isActive);
CREATE INDEX idx_partners_category ON partners(category);
CREATE INDEX idx_partners_isActive ON partners(isActive);
CREATE INDEX idx_partners_isFeatured ON partners(isFeatured);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_isPublished ON articles(isPublished);
CREATE INDEX idx_articles_publishedAt ON articles(publishedAt);
CREATE INDEX idx_contact_messages_type ON contact_messages(type);
CREATE INDEX idx_contact_messages_isRead ON contact_messages(isRead);
