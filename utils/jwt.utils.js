const jwt = require('jsonwebtoken');
require('dotenv').config();

const privateKey = process.env.PRIVATE_KEY;
const publicKey = process.env.PUBLIC_KEY;

function signJwt(object, options) {
    return jwt.sign(object, privateKey, {
        ...(options || {}),
        algorithm: "RS256",
    });
}

function verifyJwt(token) {
    try {
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        return decoded;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

module.exports = {
    signJwt,
    verifyJwt
};