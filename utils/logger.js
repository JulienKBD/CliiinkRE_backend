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

module.exports = { createLogger };
