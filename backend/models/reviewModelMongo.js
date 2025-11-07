const mongodb = require('../services/mongodb');
const { ObjectId } = require('mongodb');
const userModel = require('./userModelMongo');

// Get reviews collection
const getReviewsCollection = () => {
    const db = mongodb.getDb();
    return db.collection('reviews');
};

// Add review
const addReview = async (reviewData) => {
    try {
        const collection = getReviewsCollection();
        
        // Create review object based on MongoDB schema
        const newReview = {
            name: reviewData.name,
            style: reviewData.style,
            rating: parseFloat(reviewData.rating) || 0,
            userId: mongodb.toObjectId(reviewData.user_id),
            cheers: 0,
            cheeredBy: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Add optional fields if provided
        if (reviewData.review_pic) {
            newReview.reviewPicUrl = typeof reviewData.review_pic === 'string' 
                ? reviewData.review_pic 
                : (reviewData.review_pic.url || null);
        }
        
        if (reviewData.location) {
            newReview.location = reviewData.location;
        }
        
        // Insert the review
        const result = await collection.insertOne(newReview);
        
        // Return the new review with ID
        return {
            review_id: result.insertedId.toString(),
            ...newReview,
            userId: newReview.userId.toString() // Convert ObjectId to string for response
        };
    } catch (error) {
        console.error('Error in addReview:', error);
        throw error;
    }
};

// Get all reviews
const getReviews = async () => {
    try {
        const collection = getReviewsCollection();
        const reviews = await collection.find({}).sort({ createdAt: -1 }).toArray();
        
        // Format reviews to match the existing API
        return reviews.map(review => ({
            review_id: review._id.toString(),
            name: review.name,
            style: review.style,
            rating: review.rating,
            user_id: review.userId.toString(),
            review_pic: review.reviewPicUrl,
            location: review.location,
            cheers: review.cheers,
            date: review.createdAt
        }));
    } catch (error) {
        console.error('Error in getReviews:', error);
        throw error;
    }
};

// Get review by ID
const getReviewById = async (reviewId) => {
    try {
        if (!reviewId) {
            throw new Error('Invalid review ID');
        }
        
        const collection = getReviewsCollection();
        const review = await collection.findOne({ _id: mongodb.toObjectId(reviewId) });
        
        if (!review) {
            return null;
        }
        
        // Format review to match the existing API
        return {
            review_id: review._id.toString(),
            name: review.name,
            style: review.style,
            rating: review.rating,
            user_id: review.userId.toString(),
            review_pic: review.reviewPicUrl,
            location: review.location,
            cheers: review.cheers,
            date: review.createdAt
        };
    } catch (error) {
        console.error('Error in getReviewById:', error);
        throw error;
    }
};

// Update review
const updateReview = async (reviewId, reviewData) => {
    try {
        if (!reviewId) {
            throw new Error('Invalid review ID');
        }
        
        const collection = getReviewsCollection();
        
        // Create update object
        const updateData = {
            updatedAt: new Date()
        };
        
        if (reviewData.name !== undefined) {
            updateData.name = reviewData.name;
        }
        
        if (reviewData.style !== undefined) {
            updateData.style = reviewData.style;
        }
        
        if (reviewData.rating !== undefined) {
            updateData.rating = parseFloat(reviewData.rating) || 0;
        }
        
        if (reviewData.review_pic !== undefined) {
            updateData.reviewPicUrl = reviewData.review_pic === null ? null :
                (typeof reviewData.review_pic === 'string'
                    ? reviewData.review_pic
                    : (reviewData.review_pic?.url || null));
        }
        
        if (reviewData.location !== undefined) {
            updateData.location = reviewData.location;
        }
        
        // Update the review
        const result = await collection.updateOne(
            { _id: mongodb.toObjectId(reviewId) },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return null;
        }
        
        // Return the updated review
        return await getReviewById(reviewId);
    } catch (error) {
        console.error('Error in updateReview:', error);
        throw error;
    }
};

// Delete review
const deleteReview = async (reviewId) => {
    try {
        if (!reviewId) {
            throw new Error('Invalid review ID');
        }
        
        const collection = getReviewsCollection();
        const result = await collection.deleteOne({ _id: mongodb.toObjectId(reviewId) });
        
        return result.deletedCount > 0;
    } catch (error) {
        console.error('Error in deleteReview:', error);
        throw error;
    }
};

// Toggle cheer
const toggleCheer = async (reviewId, userId) => {
    try {
        if (!reviewId || !userId) {
            throw new Error('Review ID and User ID are required');
        }
        
        const collection = getReviewsCollection();
        const review = await collection.findOne({ _id: mongodb.toObjectId(reviewId) });
        
        if (!review) {
            throw new Error('Review not found');
        }
        
        const userObjectId = mongodb.toObjectId(userId);
        const userHasCheered = review.cheeredBy && review.cheeredBy.some(id => id.equals(userObjectId));
        
        let updateOperation;
        
        if (userHasCheered) {
            // Remove cheer
            updateOperation = {
                $pull: { cheeredBy: userObjectId },
                $inc: { cheers: -1 },
                $set: { updatedAt: new Date() }
            };
        } else {
            // Add cheer
            updateOperation = {
                $addToSet: { cheeredBy: userObjectId },
                $inc: { cheers: 1 },
                $set: { updatedAt: new Date() }
            };
        }
        
        await collection.updateOne(
            { _id: mongodb.toObjectId(reviewId) },
            updateOperation
        );
        
        // Return the updated review
        return await getReviewById(reviewId);
    } catch (error) {
        console.error('Error in toggleCheer:', error);
        throw error;
    }
};

// Check if user has cheered a review
const hasUserCheered = async (reviewId, userId) => {
    try {
        if (!reviewId || !userId) {
            throw new Error('Review ID and User ID are required');
        }
        
        const collection = getReviewsCollection();
        const review = await collection.findOne({ 
            _id: mongodb.toObjectId(reviewId),
            cheeredBy: mongodb.toObjectId(userId)
        });
        
        return !!review;
    } catch (error) {
        console.error('Error in hasUserCheered:', error);
        throw error;
    }
};

module.exports = {
    addReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview,
    toggleCheer,
    hasUserCheered
};

// Return cheerers of a review with usernames
module.exports.getCheerers = async (reviewId) => {
    try {
        if (!reviewId) {
            throw new Error('Invalid review ID');
        }
        const collection = getReviewsCollection();
        const review = await collection.findOne({ _id: mongodb.toObjectId(reviewId) });
        if (!review || !Array.isArray(review.cheeredBy) || review.cheeredBy.length === 0) {
            return [];
        }
        const db = mongodb.getDb();
        const usersCollection = db.collection('users');
        const users = await usersCollection
            .find({ _id: { $in: review.cheeredBy } }, { projection: { username: 1 } })
            .toArray();
        return users.map(u => ({ user_id: u._id.toString(), username: u.username }));
    } catch (error) {
        console.error('Error in getCheerers:', error);
        throw error;
    }
};