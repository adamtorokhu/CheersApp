const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateJWT } = require('../services/authentication');
const reviewModel = require('../models/reviewModelMongo');
const commentController = require('../controllers/commentController');

// Create a new review
router.post('/', authenticateJWT, reviewController.addReview);

// Get all reviews - public access
router.get('/', reviewController.getReviews);

// Get a specific review by ID - public access
router.get('/:review_id', reviewController.getReviewById);

// Update a review
router.put('/:review_id', authenticateJWT, reviewController.updateReview);

// Delete a review
router.delete('/:review_id', authenticateJWT, reviewController.deleteReview);

// Comments endpoints
// List comments for a review (public)
router.get('/:reviewId/comments', commentController.listComments);
// Add comment to a review (auth)
router.post('/:reviewId/comments', authenticateJWT, commentController.addComment);
// Delete comment (auth: owner or admin)
router.delete('/:reviewId/comments/:commentId', authenticateJWT, commentController.deleteComment);

// Get cheer status for a review
router.get('/:reviewId/cheer', authenticateJWT, async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.user_id;

        const hasCheered = await reviewModel.hasUserCheered(reviewId, userId);

        res.json({
            hasCheered: hasCheered
        });
    } catch (error) {
        console.error('Error getting cheer status:', error);
        res.status(500).json({ message: 'Error getting cheer status' });
    }
});

// Toggle cheer for a review
router.post('/:reviewId/cheer', authenticateJWT, async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.user_id;

        const updatedReview = await reviewModel.toggleCheer(reviewId, userId);
        const hasCheered = await reviewModel.hasUserCheered(reviewId, userId);

        res.json({
            review: updatedReview,
            hasCheered: hasCheered
        });
    } catch (error) {
        console.error('Error toggling cheer:', error);
        res.status(500).json({ message: 'Error toggling cheer' });
    }
});

// Get all cheerers (usernames) for a review - public access
router.get('/:reviewId/cheerers', async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const cheerers = await reviewModel.getCheerers(reviewId);
        res.json({ cheerers });
    } catch (error) {
        console.error('Error getting cheerers:', error);
        res.status(500).json({ message: 'Error getting cheerers' });
    }
});

module.exports = router; 
