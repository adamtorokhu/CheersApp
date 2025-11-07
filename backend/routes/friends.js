const express = require('express');
const router = express.Router();
const userModel = require('../models/userModelMongo');
const {authenticateJWT} = require("../services/authentication");

// Get friends for a user (use authenticated user's ID from JWT)
router.get('/:userId', authenticateJWT, async (req, res) => {
    try {
        // Always use the authenticated user's ID from JWT for security
        const userId = req.user.user_id;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        console.log('Getting friends for user:', userId);
        const friends = await userModel.getFriends(userId);
        res.json(friends);
    } catch (err) {
        console.error('Error in getFriends route:', err);
        res.status(500).json({ message: 'Failed to fetch friends', error: err.message });
    }
});

// Add a new friend
router.post('/add', authenticateJWT, async (req, res) => {
    try {
        // Use authenticated user's ID from JWT, friendId from body
        const userId = req.user.user_id;
        const { friendId } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!friendId) {
            return res.status(400).json({ message: 'friendId is required' });
        }
        
        // Prevent adding yourself as a friend
        if (userId === friendId) {
            return res.status(400).json({ message: 'Cannot add yourself as a friend' });
        }
        
        const result = await userModel.addFriend(userId, friendId);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remove a friend
router.delete('/remove', authenticateJWT, async (req, res) => {
    try {
        // Use authenticated user's ID from JWT, friendId from body
        const userId = req.user.user_id;
        const { friendId } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!friendId) {
            return res.status(400).json({ message: 'friendId is required' });
        }
        
        const result = await userModel.removeFriend(userId, friendId);
        res.json({ message: 'Friend removed successfully', result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 
