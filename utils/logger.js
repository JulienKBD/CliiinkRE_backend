/**
 * Logger utilitaire pour le debug des routes backend Cliiink
 * Fournit des logs structurés avec timestamps, couleurs et contexte de requête
 */

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
};

/**
 * Map des codes d'erreur MySQL/MariaDB vers des messages utilisateur clairs
 * et des codes HTTP appropriés
 */
const SQL_ERROR_MAP = {
    // Contraintes d'unicité
    ER_DUP_ENTRY: {
        status: 409,
        message: (err) => {
            // Extraire le champ en doublon depuis sqlMessage: "Duplicate entry 'xxx' for key 'table.field'"
            const match = err.sqlMessage?.match(/for key '(?:[\w.]+\.)?(\w+)'/);
            const field = match ? match[1] : 'inconnu';
            const valueMatch = err.sqlMessage?.match(/Duplicate entry '(.+?)'/);
            const value = valueMatch ? valueMatch[1] : '?';
            return `Doublon détecté : la valeur "${value}" existe déjà pour le champ "${field}". Veuillez utiliser une valeur différente.`;
        },
    },
    // Donnée trop longue pour la colonne
    ER_DATA_TOO_LONG: {
        status: 400,
        message: (err) => {
            const match = err.sqlMessage?.match(/column '(\w+)'/);
            const field = match ? match[1] : 'inconnu';
            return `La valeur du champ "${field}" dépasse la taille maximale autorisée. Veuillez raccourcir le texte.`;
        },
    },
    // Colonne ne peut pas être NULL
    ER_BAD_NULL_ERROR: {
        status: 400,
        message: (err) => {
            const match = err.sqlMessage?.match(/Column '(\w+)'/);
            const field = match ? match[1] : 'inconnu';
            return `Le champ "${field}" est obligatoire et ne peut pas être vide.`;
        },
    },
    // Pas de valeur par défaut pour un champ
    ER_NO_DEFAULT_FOR_FIELD: {
        status: 400,
        message: (err) => {
            const match = err.sqlMessage?.match(/Field '(\w+)'/);
            const field = match ? match[1] : 'inconnu';
            return `Le champ "${field}" est obligatoire et doit être renseigné.`;
        },
    },
    // Clé étrangère : la ligne référencée n'existe pas
    ER_NO_REFERENCED_ROW_2: {
        status: 400,
        message: (err) => {
            const match = err.sqlMessage?.match(/FOREIGN KEY \(`(\w+)`\)/);
            const field = match ? match[1] : 'inconnu';
            return `Référence invalide : l'élément lié au champ "${field}" n'existe pas. Vérifiez que la ressource référencée existe.`;
        },
    },
    // Clé étrangère : la ligne est référencée par une autre table
    ER_ROW_IS_REFERENCED_2: {
        status: 409,
        message: (err) => {
            const match = err.sqlMessage?.match(/CONSTRAINT `(\w+)`/);
            const constraint = match ? match[1] : '';
            return `Suppression impossible : cet élément est utilisé par d'autres données${constraint ? ` (contrainte: ${constraint})` : ''}. Supprimez d'abord les éléments liés.`;
        },
    },
    // Valeur incorrecte pour le type de colonne
    ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: {
        status: 400,
        message: (err) => {
            const fieldMatch = err.sqlMessage?.match(/column '(\w+)'/);
            const field = fieldMatch ? fieldMatch[1] : 'inconnu';
            const valueMatch = err.sqlMessage?.match(/value: '(.+?)'/);
            const value = valueMatch ? valueMatch[1] : '?';
            return `Valeur invalide "${value}" pour le champ "${field}". Vérifiez le format attendu (nombre, date, etc.).`;
        },
    },
    ER_TRUNCATED_WRONG_VALUE: {
        status: 400,
        message: (err) => {
            return `Format de donnée invalide. Vérifiez que les valeurs sont dans le bon format (nombre, date, etc.).`;
        },
    },
    // Erreur de syntaxe SQL (bug côté dev)
    ER_PARSE_ERROR: {
        status: 500,
        message: () => `Erreur interne de requête SQL. Contactez l'administrateur.`,
    },
    // Deadlock
    ER_LOCK_DEADLOCK: {
        status: 503,
        message: () => `Conflit d'accès simultané à la base de données. Veuillez réessayer dans quelques instants.`,
    },
    // Timeout de verrouillage
    ER_LOCK_WAIT_TIMEOUT: {
        status: 503,
        message: () => `Délai d'attente dépassé. La base de données est surchargée. Veuillez réessayer.`,
    },
    // Valeur hors limites (nombre trop grand)
    ER_WARN_DATA_OUT_OF_RANGE: {
        status: 400,
        message: (err) => {
            const match = err.sqlMessage?.match(/column '(\w+)'/);
            const field = match ? match[1] : 'inconnu';
            return `La valeur numérique du champ "${field}" est hors limites. Vérifiez que le nombre est dans une plage acceptable.`;
        },
    },
    // Connexion refusée
    ECONNREFUSED: {
        status: 503,
        message: () => `Impossible de se connecter à la base de données. Le service est peut-être indisponible.`,
    },
    // Connexion perdue
    PROTOCOL_CONNECTION_LOST: {
        status: 503,
        message: () => `La connexion à la base de données a été perdue. Veuillez réessayer.`,
    },
    // Connexion timeout
    ETIMEDOUT: {
        status: 503,
        message: () => `Délai de connexion à la base de données dépassé. Veuillez réessayer.`,
    },
    // Pool de connexions saturé
    ER_CON_COUNT_ERROR: {
        status: 503,
        message: () => `Trop de connexions simultanées à la base de données. Veuillez réessayer dans quelques instants.`,
    },
};

/**
 * Gère une erreur SQL de manière centralisée : log + réponse HTTP adaptée
 * @param {object} log - Instance du logger (créée via createLogger)
 * @param {object} req - Objet requête Express
 * @param {object} res - Objet réponse Express
 * @param {Error} err - L'erreur capturée
 * @param {string} context - Contexte descriptif pour le log (ex: "Création article")
 * @returns {boolean} true si l'erreur a été gérée (réponse envoyée), false sinon
 */
function handleSqlError(logger, req, res, err, context = '') {
    const errorHandler = SQL_ERROR_MAP[err.code];

    if (errorHandler) {
        const userMessage = typeof errorHandler.message === 'function'
            ? errorHandler.message(err)
            : errorHandler.message;

        logger.error(req, err, context);
        logger.warn(`↳ Erreur SQL connue [${err.code}]: ${userMessage}`);
        res.status(errorHandler.status).json({ error: userMessage });
        return true;
    }

    return false;
}

const METHOD_COLORS = {
    GET: COLORS.green,
    POST: COLORS.blue,
    PUT: COLORS.yellow,
    DELETE: COLORS.red,
    PATCH: COLORS.magenta,
};

/**
 * Retourne un timestamp formaté
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Masque les données sensibles dans un objet (password, token, etc.)
 */
function sanitize(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = { ...obj };
    const sensitiveKeys = ['password', 'currentPassword', 'newPassword', 'token', 'recaptchaToken', 'authorization'];
    for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.includes(key.toLowerCase()) || sensitiveKeys.includes(key)) {
            sanitized[key] = '***REDACTED***';
        }
    }
    return sanitized;
}

/**
 * Crée un logger pour un module de route spécifique
 * @param {string} moduleName - Nom du module (ex: 'ARTICLES', 'AUTH', 'BORNES')
 * @returns {object} - Objet logger avec les méthodes info, warn, error, debug, request, success
 */
function createLogger(moduleName) {
    const prefix = `${COLORS.bright}[${moduleName}]${COLORS.reset}`;

    return {
        /**
         * Log une requête entrante avec ses détails
         */
        request(req, extra = '') {
            const methodColor = METHOD_COLORS[req.method] || COLORS.white;
            const parts = [
                `${COLORS.dim}${getTimestamp()}${COLORS.reset}`,
                prefix,
                `${methodColor}${COLORS.bright}${req.method}${COLORS.reset}`,
                `${COLORS.cyan}${req.originalUrl}${COLORS.reset}`,
            ];

            if (extra) parts.push(`${COLORS.dim}${extra}${COLORS.reset}`);

            console.log(parts.join(' '));

            // Log params si présents
            if (req.params && Object.keys(req.params).length > 0) {
                console.log(`  ${COLORS.dim}├─ params:${COLORS.reset}`, JSON.stringify(req.params));
            }

            // Log query si présents
            if (req.query && Object.keys(req.query).length > 0) {
                console.log(`  ${COLORS.dim}├─ query:${COLORS.reset}`, JSON.stringify(req.query));
            }

            // Log body si présent (POST/PUT/PATCH) - sanitized
            if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
                const bodyKeys = Object.keys(req.body);
                console.log(`  ${COLORS.dim}├─ body keys:${COLORS.reset}`, JSON.stringify(bodyKeys));
                console.log(`  ${COLORS.dim}└─ body:${COLORS.reset}`, JSON.stringify(sanitize(req.body)).substring(0, 500));
            }
        },

        /**
         * Log un succès de requête
         */
        success(req, statusCode = 200, detail = '') {
            const parts = [
                `${COLORS.dim}${getTimestamp()}${COLORS.reset}`,
                prefix,
                `${COLORS.bgGreen}${COLORS.bright} ${statusCode} ${COLORS.reset}`,
                `${COLORS.green}${req.method} ${req.originalUrl}${COLORS.reset}`,
            ];
            if (detail) parts.push(`${COLORS.dim}— ${detail}${COLORS.reset}`);
            console.log(parts.join(' '));
        },

        /**
         * Log une erreur avec contexte complet
         */
        error(req, err, context = '') {
            console.error(
                `${COLORS.dim}${getTimestamp()}${COLORS.reset}`,
                prefix,
                `${COLORS.bgRed}${COLORS.bright} ERROR ${COLORS.reset}`,
                `${COLORS.red}${req.method} ${req.originalUrl}${COLORS.reset}`,
                context ? `${COLORS.dim}— ${context}${COLORS.reset}` : ''
            );
            console.error(`  ${COLORS.red}├─ message:${COLORS.reset}`, err.message);
            if (err.code) {
                console.error(`  ${COLORS.red}├─ code:${COLORS.reset}`, err.code);
            }
            if (err.sqlMessage) {
                console.error(`  ${COLORS.red}├─ SQL:${COLORS.reset}`, err.sqlMessage);
            }
            if (err.sql) {
                console.error(`  ${COLORS.red}├─ query:${COLORS.reset}`, err.sql.substring(0, 300));
            }
            console.error(`  ${COLORS.red}└─ stack:${COLORS.reset}`, err.stack?.split('\n').slice(0, 4).join('\n    '));
        },

        /**
         * Log d'information générale
         */
        info(...args) {
            console.log(
                `${COLORS.dim}${getTimestamp()}${COLORS.reset}`,
                prefix,
                `${COLORS.blue}ℹ${COLORS.reset}`,
                ...args
            );
        },

        /**
         * Log d'avertissement
         */
        warn(...args) {
            console.warn(
                `${COLORS.dim}${getTimestamp()}${COLORS.reset}`,
                prefix,
                `${COLORS.yellow}⚠${COLORS.reset}`,
                ...args
            );
        },

        /**
         * Log de debug (seulement si DEBUG=true dans l'env)
         */
        debug(...args) {
            if (process.env.DEBUG === 'true') {
                console.log(
                    `${COLORS.dim}${getTimestamp()}${COLORS.reset}`,
                    prefix,
                    `${COLORS.magenta}🔍${COLORS.reset}`,
                    ...args
                );
            }
        },
    };
}

module.exports = { createLogger, handleSqlError, SQL_ERROR_MAP };
