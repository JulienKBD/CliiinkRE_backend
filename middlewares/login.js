const COLORS = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
};

const METHOD_COLORS = {
    GET: COLORS.green,
    POST: COLORS.blue,
    PUT: COLORS.yellow,
    DELETE: COLORS.red,
    PATCH: COLORS.magenta,
};

const loggingMiddleware = (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    const methodColor = METHOD_COLORS[req.method] || COLORS.cyan;

    // Log à la fin de la réponse
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        let statusColor = COLORS.green;
        if (statusCode >= 400 && statusCode < 500) statusColor = COLORS.yellow;
        if (statusCode >= 500) statusColor = COLORS.red;

        console.log(
            `${COLORS.dim}${timestamp}${COLORS.reset}`,
            `${COLORS.bright}[HTTP]${COLORS.reset}`,
            `${methodColor}${req.method}${COLORS.reset}`,
            `${COLORS.cyan}${req.originalUrl}${COLORS.reset}`,
            `${statusColor}${statusCode}${COLORS.reset}`,
            `${COLORS.dim}${duration}ms${COLORS.reset}`,
            req.headers['x-forwarded-for'] || req.socket?.remoteAddress ? `${COLORS.dim}(${req.headers['x-forwarded-for'] || req.socket?.remoteAddress})${COLORS.reset}` : ''
        );
    });

    next();
};

module.exports = loggingMiddleware;