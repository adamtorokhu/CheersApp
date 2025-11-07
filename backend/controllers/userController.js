const userModel = require('../models/userModelMongo');

// Get all users
async function getUsers(req, res) {
    try {
        const users = await userModel.getUsers();
        // Transform MongoDB documents to include user_id and dateofbirth for frontend compatibility
        const transformedUsers = users.map(user => {
            const transformed = {
                ...user,
                user_id: user._id ? user._id.toString() : user.user_id,
                // MongoDB stores dateOfBirth, frontend expects dateofbirth
                dateofbirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : user.dateofbirth
            };
            // Remove the MongoDB-specific field to avoid confusion
            delete transformed.dateOfBirth;
            return transformed;
        });
        res.json(transformedUsers);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users', error: err.message });
    }
}

// Get user by ID
async function getUser(req, res) {
    try {
        const user = await userModel.getUser(req.params.user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Transform MongoDB document to include user_id and dateofbirth for frontend compatibility
        const userResponse = {
            ...user,
            user_id: user._id ? user._id.toString() : user.user_id,
            // MongoDB stores dateOfBirth, frontend expects dateofbirth
            dateofbirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : user.dateofbirth
        };
        // Remove the MongoDB-specific field to avoid confusion
        delete userResponse.dateOfBirth;
        res.json(userResponse);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user', error: err.message });
    }
}

// Get public user info
async function getPublicUserInfo(req, res) {
    try {
        const user = await userModel.getUser(req.params.user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Only send non-sensitive information
        // Transform MongoDB document to include user_id
        const userId = user._id ? user._id.toString() : user.user_id;
        res.json({
            user_id: userId,
            username: user.username,
            profile_pic: user.profile_pic || user.profilePicUrl
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user', error: err.message });
    }
}

// Create new user
async function createUser(req, res) {
    try {
        const user = await userModel.addUser(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create user', error: err.message });
    }
}

// Update user
async function updateUser(req, res) {
    try {
        const userData = { ...req.body, user_id: req.params.user_id };
        if (!userData.password) {
            delete userData.password;
        }
        const user = await userModel.updateUser(userData);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update user', error: err.message });
    }
}

// Delete user
async function deleteUser(req, res) {
    try {
        console.log('Attempting to delete user:', req.params.user_id);
        const result = await userModel.deleteUser(req.params.user_id);
        console.log('Delete operation result:', result);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error in delete controller:', err);
        res.status(500).json({ message: 'Failed to delete user', error: err.message });
    }
}

// Friend operations
async function getFriends(req, res) {
    try {
        const friends = await userModel.getFriends(req.params.user_id);
        res.json(friends);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch friends', error: err.message });
    }
}

async function addFriend(req, res) {
    try {
        const result = await userModel.addFriend(req.body.friend1, req.body.friend2);
        res.json({ message: 'Friend added successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add friend', error: err.message });
    }
}

async function removeFriend(req, res) {
    try {
        const result = await userModel.removeFriend(req.body.friend1, req.body.friend2);
        res.json({ message: 'Friend removed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove friend', error: err.message });
    }
}

module.exports = {
    getUsers,
    getUser,
    getPublicUserInfo,
    createUser,
    updateUser,
    deleteUser,
    getFriends,
    addFriend,
    removeFriend
};
