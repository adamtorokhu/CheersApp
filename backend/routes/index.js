const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");
const userModel = require("../models/userModelMongo");
const jwt = require('jsonwebtoken');
const { checkPassword, authenticateJWT } = require('../services/authentication');

router.get('/', (req, res) => {
    res.json({ message: 'API is working' });
});

// Gets authenticated user data
router.get('/current-user', authenticateJWT, async (req, res) => {
    try {
        const user = await userModel.getUser(req.user.user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Transform MongoDB document to include user_id for frontend compatibility
        const userResponse = {
            ...user,
            user_id: user._id ? user._id.toString() : user.user_id
        };
        res.json(userResponse);
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ message: 'Failed to get current user', error: error.message });
    }
});

// Handles auth, JWT token gen and secure cookies
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        const users = await userModel.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await checkPassword(password, user.passwordHash);

        if (passwordMatch) {
            console.log('Login successful for:', email);
            console.log('User object from DB:', { 
                _id: user._id, 
                _idType: typeof user._id,
                _idString: user._id ? user._id.toString() : 'N/A',
                user_id: user.user_id 
            });

            // MongoDB uses _id, convert to string for JWT
            const userId = user._id ? user._id.toString() : user.user_id;
            console.log('User ID to be stored in JWT:', userId);

            const accessToken = jwt.sign(
                { user_id: userId, email: user.email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '1h' }
            );

            // Set cookie options based on environment
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                // Allow cross-site cookies in production (frontend hosted on a different domain)
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 3600000, // 1 hour
                path: '/'
            };

            // Only set domain if both frontend and backend are on the same parent domain
            // Example: api.yourdomain.com and app.yourdomain.com can share .yourdomain.com
            // DO NOT set domain if backend is on a different domain (e.g., backend on render.com)
            if (process.env.COOKIE_DOMAIN) {
                cookieOptions.domain = process.env.COOKIE_DOMAIN;
            }

            // In development, don't set secure flag (served over http)
            if (process.env.NODE_ENV !== 'production') {
                delete cookieOptions.secure;
            }

            res.cookie('accessToken', accessToken, cookieOptions);
            
            console.log('Cookie set with options:', {
                httpOnly: cookieOptions.httpOnly,
                sameSite: cookieOptions.sameSite,
                secure: cookieOptions.secure,
                path: cookieOptions.path,
                domain: cookieOptions.domain || 'not set (will use request domain)'
            });

            res.json({
                success: true,
                user: {
                    user_id: userId,
                    email: user.email,
                    username: user.username
                }
            });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Creates user and returns base64 token
router.post('/users/new', async (req, res) => {
    try {
        const user = await userModel.addUser(req.body);

        const token = Buffer.from(user.user_id.toString()).toString('base64');
        res.status(201).json({ 
            message: 'User registered successfully', 
            token, 
            user: { user_id: user.user_id, username: user.username, email: user.email } 
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Failed to register user', error: err.message });
    }
});

// Clears auth cookies with security options
router.post('/logout', authenticateJWT, (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
    };

    // In development, don't set secure flag (localhost served over http)
    if (process.env.NODE_ENV !== 'production') {
        delete cookieOptions.secure;
    }

    res.clearCookie('accessToken', cookieOptions);
    res.json({ message: 'Logged out successfully' });
    console.log('User logged out successfully');
});

module.exports = router;
