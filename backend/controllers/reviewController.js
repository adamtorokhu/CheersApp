const reviewModel = require('../models/reviewModelMongo');

// Creates review with image handling and user auth
const addReview = async (req, res) => {
    try {
        // Validate required fields
        const { name, style, rating } = req.body;
        if (!name || !style || rating === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Ensure review_pic is properly formatted
        let review_pic = req.body.review_pic;
        if (review_pic && typeof review_pic === 'object' && review_pic.url) {
            review_pic = review_pic.url;
        }

        const reviewData = {
            name: req.body.name,
            style: req.body.style,
            rating: parseFloat(req.body.rating) || 0,
            user_id: req.user?.user_id || req.body.user_id, // Fallback to body user_id if no auth
            review_pic: review_pic,
            location: req.body.location
        };

        const newReview = await reviewModel.addReview(reviewData);
        res.status(201).json(newReview);
    } catch (error) {
        console.error('Error in addReview controller:', error);
        res.status(500).json({ error: error.message || 'Failed to create review' });
    }
};

const getReviews = async (req, res) => {
    try {
        const reviews = await reviewModel.getReviews();
        res.json(reviews);
    } catch (error) {
        console.error('Error in getReviews controller:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch reviews' });
    }
};

const getReviewById = async (req, res) => {
    try {
        const review = await reviewModel.getReviewById(req.params.review_id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json(review);
    } catch (error) {
        console.error('Error in getReviewById controller:', error);
        if (error.message === 'Invalid review ID') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to fetch review' });
    }
};

// Updates review with image and field validation
const updateReview = async (req, res) => {
    try {
        // Validate required fields
        const { name, style, rating } = req.body;
        if (!name || !style || rating === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Ensure review_pic is properly formatted
        let review_pic = req.body.review_pic;
        if (review_pic && typeof review_pic === 'object' && review_pic.url) {
            review_pic = review_pic.url;
        }

        const reviewData = {
            name: req.body.name,
            style: req.body.style,
            rating: parseFloat(req.body.rating) || 0,
            review_pic: review_pic,
            location: req.body.location
        };

        const updatedReview = await reviewModel.updateReview(req.params.review_id, reviewData);
        if (!updatedReview) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json(updatedReview);
    } catch (error) {
        console.error('Error in updateReview controller:', error);
        if (error.message === 'Invalid review ID') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to update review' });
    }
};

const deleteReview = async (req, res) => {
    try {
        const result = await reviewModel.deleteReview(req.params.review_id);
        if (!result) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error in deleteReview controller:', error);
        if (error.message === 'Invalid review ID') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to delete review' });
    }
};

module.exports = {
    addReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview
};
