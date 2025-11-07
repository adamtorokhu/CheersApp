const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateJWT } = require('../services/authentication');

// Get all users (protected)
router.get('/', authenticateJWT, userController.getUsers);

// Get public user info (username and profile pic only)
router.get('/:user_id/public', userController.getPublicUserInfo);

// Get full user info (protected)
router.get('/:user_id', authenticateJWT, userController.getUser);

// Create new user
router.post('/', userController.createUser);

// Update user (protected)
router.put('/:user_id', authenticateJWT, userController.updateUser);

// Delete user (protected)
router.delete('/:user_id', authenticateJWT, userController.deleteUser);

// Friend operations
router.get('/:user_id/friends', authenticateJWT, userController.getFriends);
router.post('/friends', authenticateJWT, userController.addFriend);
router.delete('/friends', authenticateJWT, userController.removeFriend);

module.exports = router;
