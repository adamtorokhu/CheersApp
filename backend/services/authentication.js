const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

async function checkPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

function authenticateJWT(req, res, next) {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        // Store the decoded token payload (which contains user_id and email)
        req.user = decoded;
        console.log('JWT decoded successfully:', { user_id: decoded.user_id, email: decoded.email });
        next();
    });
}

module.exports = {
    checkPassword,
    authenticateJWT
};