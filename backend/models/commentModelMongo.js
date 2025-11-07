const mongodb = require('../services/mongodb');
const userModel = require('./userModelMongo');

// Get comments collection
const getCommentsCollection = () => {
  const db = mongodb.getDb();
  return db.collection('comments');
};

// Create a new comment
async function createComment(reviewId, userId, text) {
  const collection = getCommentsCollection();

  const createdAt = new Date();
  const updatedAt = createdAt;

  // Get username for denormalization
  let username = 'Anonymous';
  try {
    const user = await userModel.getUser(userId);
    if (user && user.username) username = user.username;
  } catch (_) {}

  const doc = {
    reviewId: mongodb.toObjectId(reviewId),
    userId: mongodb.toObjectId(userId),
    username,
    text,
    createdAt,
    updatedAt,
  };

  const result = await collection.insertOne(doc);
  return {
    id: result.insertedId.toString(),
    reviewId: reviewId.toString(),
    userId: userId.toString(),
    username,
    text,
    date: createdAt,
  };
}

// List comments for a review (newest first)
async function getCommentsByReview(reviewId) {
  const collection = getCommentsCollection();
  const items = await collection
    .find({ reviewId: mongodb.toObjectId(reviewId) })
    .sort({ createdAt: -1 })
    .toArray();

  return items.map((c) => ({
    id: c._id.toString(),
    reviewId: c.reviewId.toString(),
    userId: c.userId.toString(),
    username: c.username,
    text: c.text,
    date: c.createdAt,
  }));
}

// Delete a comment by id (no permission check here)
async function deleteCommentById(commentId) {
  const collection = getCommentsCollection();
  const res = await collection.deleteOne({ _id: mongodb.toObjectId(commentId) });
  return res.deletedCount > 0;
}

// Get a single comment by id
async function getCommentById(commentId) {
  const collection = getCommentsCollection();
  const c = await collection.findOne({ _id: mongodb.toObjectId(commentId) });
  if (!c) return null;
  return {
    id: c._id.toString(),
    reviewId: c.reviewId.toString(),
    userId: c.userId.toString(),
    username: c.username,
    text: c.text,
    date: c.createdAt,
  };
}

module.exports = {
  createComment,
  getCommentsByReview,
  deleteCommentById,
  getCommentById,
};
