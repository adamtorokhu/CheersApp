const mongodb = require('../services/mongodb');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

// Get users collection
const getUsersCollection = () => {
    const db = mongodb.getDb();
    return db.collection('users');
};

// Get all users
const getUsers = async () => {
    try {
        const collection = getUsersCollection();
        const users = await collection.find({}).toArray();
        return users;
    } catch (error) {
        console.error('Error in getUsers:', error);
        throw error;
    }
};

// Get user by ID
const getUser = async (userId) => {
    try {
        const collection = getUsersCollection();
        const user = await collection.findOne({ _id: mongodb.toObjectId(userId) });
        return user;
    } catch (error) {
        console.error('Error in getUser:', error);
        throw error;
    }
};

// Update user
const updateUser = async (userData) => {
    try {
        const collection = getUsersCollection();
        const userId = mongodb.toObjectId(userData.user_id);
        
        // Create update object
        const updateData = {
            username: userData.username,
            email: userData.email,
            dateOfBirth: new Date(userData.dateofbirth)
        };
        
        // Handle password update if provided
        if (userData.password) {
            updateData.passwordHash = await bcrypt.hash(userData.password, 10);
        }
        
        // Handle profile image update if provided
        if (userData.profileImage && userData.profileImage.url) {
            updateData.profilePicUrl = userData.profileImage.url;
        }
        
        // Update the user
        const result = await collection.updateOne(
            { _id: userId },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            throw new Error('User not found');
        }
        
        // Return the updated user
        return await getUser(userData.user_id);
    } catch (error) {
        console.error('Error in updateUser:', error);
        throw error;
    }
};

// Add user
const addUser = async (userData) => {
    try {
        const collection = getUsersCollection();
        
        // Create user object
        const newUser = {
            username: userData.username,
            email: userData.email,
            dateOfBirth: new Date(userData.dateofbirth),
            passwordHash: await bcrypt.hash(userData.password, 10),
            friends: []
        };
        
        // Add profile image if provided
        if (userData.profileImage && userData.profileImage.url) {
            newUser.profilePicUrl = userData.profileImage.url;
        }
        
        // Insert the user
        const result = await collection.insertOne(newUser);
        
        // Return the new user with ID
        return {
            user_id: result.insertedId.toString(),
            ...userData
        };
    } catch (error) {
        console.error('Error in addUser:', error);
        throw error;
    }
};

// Get friends
const getFriends = async (userId) => {
    try {
        const collection = getUsersCollection();
        const user = await collection.findOne({ _id: mongodb.toObjectId(userId) });
        
        if (!user || !user.friends || user.friends.length === 0) {
            return [];
        }
        
        // Convert the array of friend IDs to an array of friend objects
        const friendIds = user.friends.map(id => mongodb.toObjectId(id));
        const friends = await collection.find({ _id: { $in: friendIds } }).toArray();
        
        // Format the response to match the existing API
        return friends.map(friend => ({
            friend1: userId,
            friend2: friend._id.toString()
        }));
    } catch (error) {
        console.error('Error in getFriends:', error);
        throw error;
    }
};

// Add friend
const addFriend = async (userId, friendId) => {
    try {
        const collection = getUsersCollection();
        
        // Add friend to user's friends array
        await collection.updateOne(
            { _id: mongodb.toObjectId(userId) },
            { $addToSet: { friends: mongodb.toObjectId(friendId) } }
        );
        
        return { success: true };
    } catch (error) {
        console.error('Error in addFriend:', error);
        throw error;
    }
};

// Remove friend
const removeFriend = async (userId, friendId) => {
    try {
        const collection = getUsersCollection();
        
        // Remove friend from user's friends array
        await collection.updateOne(
            { _id: mongodb.toObjectId(userId) },
            { $pull: { friends: mongodb.toObjectId(friendId) } }
        );
        
        return { success: true };
    } catch (error) {
        console.error('Error in removeFriend:', error);
        throw error;
    }
};

// Delete user
const deleteUser = async (userId) => {
    try {
        const db = mongodb.getDb();
        const usersCollection = getUsersCollection();
        const reviewsCollection = db.collection('reviews');
        const userObjectId = mongodb.toObjectId(userId);
        
        // Delete all reviews created by this user
        const reviewsDeleteResult = await reviewsCollection.deleteMany({ 
            userId: userObjectId 
        });
        console.log(`Deleted ${reviewsDeleteResult.deletedCount} reviews for user ${userId}`);
        
        // Remove this user from all other users' friends lists
        const friendsUpdateResult = await usersCollection.updateMany(
            { friends: userObjectId },
            { $pull: { friends: userObjectId } }
        );
        console.log(`Removed user ${userId} from ${friendsUpdateResult.modifiedCount} friends lists`);
        
        // Delete the user
        const result = await usersCollection.deleteOne({ _id: userObjectId });
        
        if (result.deletedCount === 0) {
            throw new Error('User not found');
        }
        
        return { 
            success: true,
            reviewsDeleted: reviewsDeleteResult.deletedCount,
            friendsListsUpdated: friendsUpdateResult.modifiedCount
        };
    } catch (error) {
        console.error('Error in deleteUser:', error);
        throw error;
    }
};

module.exports = {
    getUsers,
    getUser,
    updateUser,
    addUser,
    deleteUser,
    getFriends,
    addFriend,
    removeFriend
};