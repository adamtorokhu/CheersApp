const commentModel = require('../models/commentModelMongo');
const userModel = require('../models/userModelMongo');

// GET /api/reviews/:reviewId/comments
async function listComments(req, res) {
  try {
    const { reviewId } = req.params;
    if (!reviewId) return res.status(400).json({ message: 'Review ID is required' });
    const comments = await commentModel.getCommentsByReview(reviewId);
    res.json({ comments });
  } catch (error) {
    console.error('Error listing comments:', error);
    res.status(500).json({ message: 'Failed to load comments' });
  }
}

// POST /api/reviews/:reviewId/comments
async function addComment(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.user && req.user.user_id;
    const { text } = req.body || {};

    if (!userId) return res.status(401).json({ message: 'Authentication required' });
    if (!reviewId) return res.status(400).json({ message: 'Review ID is required' });

    const trimmed = (text || '').toString().trim();
    if (!trimmed) return res.status(400).json({ message: 'Comment text is required' });
    if (trimmed.length > 1000) return res.status(400).json({ message: 'Comment text too long (max 1000 chars)' });

    const created = await commentModel.createComment(reviewId, userId, trimmed);
    res.status(201).json({ comment: created });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
}

// DELETE /api/reviews/:reviewId/comments/:commentId
async function deleteComment(req, res) {
  try {
    const { commentId } = req.params;
    const requesterId = req.user && req.user.user_id;

    if (!requesterId) return res.status(401).json({ message: 'Authentication required' });
    if (!commentId) return res.status(400).json({ message: 'Comment ID is required' });

    const comment = await commentModel.getCommentById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isOwner = comment.userId && comment.userId.toString() === requesterId.toString();
    let isAdmin = false;
    try {
      const user = await userModel.getUser(requesterId);
      isAdmin = !!(user && (user.admin === 1 || user.admin === true));
    } catch (_) {}

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    const deleted = await commentModel.deleteCommentById(commentId);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete comment' });
    }

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
}

module.exports = {
  listComments,
  addComment,
  deleteComment,
};
