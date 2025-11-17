import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from "./NavBar.jsx";
import * as apiService from '../services/apiService';

const ReviewDetailPage = () => {
    const { review_id } = useParams();
    const navigate = useNavigate();
    const [review, setReview] = useState(null);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState('');
    const [newComment, setNewComment] = useState('');
    const [hasCheered, setHasCheered] = useState(false);
    const [cheersCount, setCheersCount] = useState(0);
    const [lastCheerer, setLastCheerer] = useState('');
    const [cheerers, setCheerers] = useState([]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        // Pad single digits with leading zero
        const pad = (n) => n.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    // Separate effect for fetching review and username
    useEffect(() => {
        const fetchReviewData = async () => {
            try {
                // Fetch review data
                const reviewData = await apiService.getReview(review_id);
                setReview(reviewData);
                setCheersCount(reviewData.cheers || 0);
                
                // Fetch review author's username using public endpoint
                if (reviewData.user_id) {
                    try {
                        const authorData = await apiService.getPublicUser(reviewData.user_id);
                        setUsername(authorData.username);
                    } catch (err) {
                        console.error('Error fetching author data:', err);
                        setUsername('Unknown User');
                    }
                }
            } catch (err) {
                setError('Failed to load review. Please try again.');
                console.error('Error fetching review data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewData();
    }, [review_id]);

    // Load comments from server when review_id changes
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (!review_id) return;
            setCommentsLoading(true);
            setCommentsError('');
            try {
                const list = await apiService.getComments(review_id);
                if (isMounted) setComments(Array.isArray(list) ? list : []);
            } catch (e) {
                console.error('Failed to load comments:', e);
                if (isMounted) {
                    setComments([]);
                    setCommentsError('Failed to load comments.');
                }
            } finally {
                if (isMounted) setCommentsLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [review_id]);

    // Separate effect for checking authentication only when needed
    useEffect(() => {
        const checkAuth = async () => {
            if (!review) return; // Don't check auth until we have a review

            try {
                const userData = await apiService.getCurrentUser();
                setCurrentUser(userData);
                setIsAdmin(userData.admin === 1);
                setIsAuthenticated(true);
            } catch (err) {
                // Ignore authentication errors
                if (!err.message?.includes('Authentication required')) {
                    console.error('Error fetching user data:', err);
                }
                setCurrentUser(null);
                setIsAdmin(false);
                setIsAuthenticated(false);
            }
        };

        // Only check auth if we have a review
        if (review) {
            checkAuth();
        }
    }, [review]);

    // Check cheer status once authenticated and review loaded
    useEffect(() => {
        const run = async () => {
            if (!review || !isAuthenticated) return;
            try {
                const status = await apiService.getCheerStatus(review.review_id);
                setHasCheered(!!status.hasCheered);
                // If already cheered and no stored last cheerer, default to current user
                if (status.hasCheered && !lastCheerer && currentUser?.username) {
                    setLastCheerer(currentUser.username);
                    try { localStorage.setItem(`review_last_cheerer_${review_id}`, currentUser.username); } catch {}
                }
                // Load cheerers list
                try {
                    const list = await apiService.getCheerers(review.review_id);
                    if (Array.isArray(list?.cheerers)) {
                        setCheerers(list.cheerers);
                        if (list.cheerers.length === 0) {
                            setLastCheerer('');
                            try { localStorage.removeItem(`review_last_cheerer_${review_id}`); } catch {}
                        }
                    }
                } catch (e) { /* ignore */ }
            } catch (e) {
                // ignore
            }
        };
        run();
    }, [review, isAuthenticated, currentUser, lastCheerer, review_id]);

    // Load last cheerer (local) for display
    useEffect(() => {
        try {
            const stored = localStorage.getItem(`review_last_cheerer_${review_id}`);
            if (stored) setLastCheerer(stored);
        } catch {}
    }, [review_id]);


    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Please log in to comment.');
            return;
        }
        const text = newComment.trim();
        if (!text) return;
        try {
            // Optimistic UI: optionally could add temp item; for simplicity, wait for server
            const created = await apiService.addComment(review_id, text);
            setComments(prev => [created, ...prev]);
            setNewComment('');
        } catch (err) {
            console.error('Failed to add comment:', err);
            alert(err.message || 'Failed to add comment');
        }
    };

    const handleDeleteComment = async (id) => {
        const target = comments.find(c => c.id === id);
        const canDelete = isAdmin || (currentUser && target && target.userId === currentUser.user_id);
        if (!canDelete) return;
        try {
            await apiService.deleteComment(review_id, id);
            setComments(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Failed to delete comment:', err);
            alert(err.message || 'Failed to delete comment');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            try {
                await apiService.deleteReview(review_id);
                navigate('/');
            } catch (err) {
                setError('Failed to delete review. Please try again.');
            }
        }
    };

    const handleCheerClick = async () => {
        if (!isAuthenticated) {
            alert('Please log in to cheer for reviews');
            return;
        }
        try {
            const response = await apiService.toggleCheer(review.review_id);
            if (response?.review) {
                setReview(response.review);
                setCheersCount(response.review.cheers || 0);
            }
            setHasCheered(!!response?.hasCheered);
            if (response?.hasCheered && currentUser?.username) {
                setLastCheerer(currentUser.username);
                try { localStorage.setItem(`review_last_cheerer_${review_id}`, currentUser.username); } catch {}
            } else if (!response?.hasCheered) {
                // If cheer was removed, clear last cheerer
                setLastCheerer('');
                try { localStorage.removeItem(`review_last_cheerer_${review_id}`); } catch {}
            }
            // Refresh cheerers list
            try {
                const list = await apiService.getCheerers(review.review_id);
                if (Array.isArray(list?.cheerers)) {
                    setCheerers(list.cheerers);
                    if (list.cheerers.length === 0) {
                        setLastCheerer('');
                        try { localStorage.removeItem(`review_last_cheerer_${review_id}`); } catch {}
                    }
                }
            } catch (e) { /* ignore */ }
        } catch (error) {
            console.error('Error toggling cheer:', error);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">
                    {error}
                </div>
            </div>
        );
    }

    if (!review) {
        return (
            <div className="not-found-container">
                <h2>Review not found</h2>
                <button
                    onClick={() => navigate('/')}
                    className="back-button"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    const canEdit = currentUser && (currentUser.user_id === review.user_id || isAdmin);

    return (
        <div className="home-reviews-container">
            <NavBar className="navbar"/>
            <div className="review-card">
                <div className="review-main-row" style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
                    <div className="review-header">
                        <img
                            src={apiService.buildImageUrl(review.review_pic) || '/uploads/icons/DefaultReview.svg'}
                            alt={`${review.name} beer`}
                            className="review-pic"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/uploads/icons/DefaultReview.svg';
                            }}
                        />
                    </div>
                    <div className="review-info">
                        <div className="review-header">
                            {username && (
                                <div className="review-section">
                                    <p>@{username}</p>
                                </div>
                            )}
                            <h1>{review.name}</h1>
                            <div className="beer-type">
                                <span>🍺 {review.style}</span>
                            </div>
                            <div className="rating">
                                <img src="/uploads/icons/star.svg" alt=""/>
                                <span className="rating-value">{review.rating}</span>
                                <span className="rating-max">/5.0</span>
                            </div>
                            <div className="review-section">
                                <p>{formatDate(review.date)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="review-content">
                    <div className="review-section">
                        {review.location && (
                            <div className="review-section user-location">
                                <span role="img" aria-label="location">📍</span>
                                <span>{review.location}</span>
                            </div>
                        )}
                    </div>
                </div>
                {/* Social (cheers) stays with the card */}
                <div className="review-content">
                    <div className="review-section">
                        <div className='social' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                                className="cheers-button"
                                src={hasCheered ? "/uploads/icons/cheersd.svg" : "/uploads/icons/cheers.svg"}
                                alt="Cheers"
                                onClick={handleCheerClick}
                                style={{ cursor: 'pointer' }}
                            />
                            <p style={{ margin: 0 }}>{cheersCount}</p>
                            {cheerers.length > 0 && (
                                <span style={{ opacity: 0.8, marginLeft: 8 }}>
                                    {cheerers.map(c => `@${c.username}`).join(', ')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments moved under the card */}
            <section className="comments-section">
                <div className="comments-header">
                    <h2>Comments</h2>
                </div>
                {isAuthenticated ? (
                    <form onSubmit={handleAddComment} className="comment-form">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            rows={3}
                            className="comment-textarea"
                        />
                        <div className="comment-actions">
                            <button type="submit" className="back-button">
                                <img src="/uploads/icons/post.svg" alt="post comment"/>
                            </button>
                        </div>
                    </form>
                ) : (
                    <p className="comment-login-hint">Log in to post a comment.</p>
                )}

                {commentsError && (
                    <div className="error-message" style={{ marginBottom: '8px' }}>{commentsError}</div>
                )}
                {commentsLoading ? (
                    <p style={{ opacity: 0.8 }}>Loading comments...</p>
                ) : (
                    <div className="comment-list">
                        {comments.length === 0 ? (
                            <p className="no-comments">No comments yet.</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="comment-card">
                                    <div className="comment-card-header">
                                        <div>
                                            <strong>@{comment.username}</strong>
                                            <span className="comment-date">{formatDate(comment.date)}</span>
                                        </div>
                                        {(isAdmin || (currentUser && currentUser.user_id === comment.userId)) && (
                                            <button className="delete-button" onClick={() => handleDeleteComment(comment.id)}>
                                                <img src="/uploads/icons/delete.svg" alt="Delete"/>
                                            </button>
                                        )}
                                    </div>
                                    <div className="comment-card-body">
                                        <p>{comment.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>
            <div className="social">
                {canEdit && (
                    <>
                        <button
                            onClick={() => navigate(`/reviews/${review_id}/edit`)}
                            className="edit-button"
                        >
                            <img src="/uploads/icons/edit.svg" alt="edit"/>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="delete-button"
                        >
                            <img src="/uploads/icons/delete.svg" alt="delete"/>
                        </button>
                    </>
                )}
                <button
                    onClick={() => navigate('/')} 
                    className="back-button"
                >
                    <img src="/uploads/icons/home.svg" alt="home"/>
                </button>
            </div>
        </div>
    );
};

export default ReviewDetailPage;