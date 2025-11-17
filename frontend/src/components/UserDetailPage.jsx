import React, { useState, useEffect } from "react";
import {useParams, useNavigate, Link} from "react-router-dom";
import * as apiService from "../services/apiService.js";
import API_BASE_URL from "../services/apiService.js";
import '../index.css'
import NavBar from "./NavBar.jsx";
import ReviewCard from "./ReviewCard.jsx";
import { format as formatDateFns, isValid, parseISO } from 'date-fns';
import ReviewButton from "./ReviewButton.jsx";

function UserDetailPage() {
    const [reviews, setReviews] = useState([]);
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [friends, setFriends] = useState([]);
    const { user_id } = useParams();
    const navigate = useNavigate();

    const formatDateLocal = (dateString) => {
        if (!dateString) return '';
        // Accepts both string and Date
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        if (!isValid(date)) return dateString;
        return formatDateFns(date, 'yyyy-MM-dd');
    };

    const fetchFriendsDetails = async (friendIds, profileUserIdParam) => {
        try {
            if (!Array.isArray(friendIds)) {
                console.error('Invalid friendIds:', friendIds);
                return [];
            }

            // Filter out any invalid friend IDs
            const validFriendIds = friendIds.filter(friendId => 
                friendId && (typeof friendId === 'object' ? 
                    (friendId.friend1 || friendId.friend2) : 
                    friendId
                )
            );

            // Get the profile user's ID as a string for comparison
            // Use the parameter if provided, otherwise fall back to user state or user_id from URL
            const profileUserId = profileUserIdParam 
                ? String(profileUserIdParam) 
                : (user?.user_id ? String(user.user_id) : String(user_id));

            // Map each friend ID to a promise that fetches that user's details
            const friendDetailsPromises = validFriendIds.map(friendId => {
                let id;
                if (typeof friendId === 'object') {
                    // friendId is a friendship object with friend1 and friend2
                    // Get the OTHER user's ID (not the profile owner's ID)
                    const friend1 = String(friendId.friend1 || '');
                    const friend2 = String(friendId.friend2 || '');
                    id = friend1 === profileUserId ? friend2 : friend1;
                } else {
                    // friendId is already a user ID string
                    id = friendId;
                }
                
                // Skip if the ID matches the profile user (shouldn't happen, but safety check)
                if (id === profileUserId) {
                    console.warn('Skipping self as friend:', id, 'profileUserId:', profileUserId);
                    return null;
                }
                
                return apiService.getUser(id)
                    .catch(err => {
                        console.error(`Error fetching details for friend ${id}:`, err);
                        return null;
                    });
            });

            // Wait for all promises to resolve and filter out failed requests
            const friendDetails = (await Promise.all(friendDetailsPromises))
                .filter(friend => friend !== null);
            
            // Deduplicate friends based on user_id and ensure user_id is set
            const uniqueFriends = friendDetails.reduce((acc, friend) => {
                if (friend) {
                    // Ensure friend has user_id (from backend transformation)
                    const friendUserId = friend.user_id || (friend._id ? friend._id.toString() : null);
                    if (!friendUserId) {
                        console.warn('Friend missing user_id, skipping:', friend);
                        return acc;
                    }
                    // Add user_id if it's missing (shouldn't happen after backend transformation, but safety check)
                    if (!friend.user_id) {
                        friend.user_id = friendUserId;
                    }
                    // Check if we already have this friend
                    if (!acc.some(f => {
                        const fUserId = f.user_id || (f._id ? f._id.toString() : null);
                        return fUserId === friendUserId;
                    })) {
                        acc.push(friend);
                    }
                }
                return acc;
            }, []);
            
            console.log('Fetched friends:', uniqueFriends.map(f => ({ 
                user_id: f.user_id, 
                username: f.username,
                profileUserId 
            })));
            
            return uniqueFriends;
        } catch (err) {
            console.error('Error fetching friend details:', err);
            return [];
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // First get current user to check permissions
                const currentUserData = await apiService.getCurrentUser();
                setCurrentUser(currentUserData);
                setIsAuthenticated(true);

                // Fetch user details and reviews
                const [userData, reviewsData, friendsData] = await Promise.all([
                    apiService.getUser(user_id),
                    apiService.getReviewsByUser(user_id),
                    apiService.getFriends(user_id)
                ]);
                
                // Set user first so fetchFriendsDetails can use it
                setUser(userData);
                
                // Fetch complete user details for each friend
                // Pass userData.user_id explicitly to avoid stale closure issues
                const profileUserId = userData.user_id || userData._id?.toString() || user_id;
                const friendDetails = await fetchFriendsDetails(friendsData, profileUserId);
                
                setReviews(reviewsData);
                setFriends(friendDetails);
                setIsLoading(false);
            } catch (err) {
                if (err.message.includes('Authentication required')) {
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                }
                setError(`Failed to load data: ${err.message}`);
                if (err.message.includes('401') || err.message.includes('403')) {
                    navigate('/login');
                }
                setIsLoading(false);
            }
        };

        if (user_id) {
            setIsLoading(true);
            setError('');
            fetchData();
        }
    }, [user_id, navigate]);

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${user?.username}? This action cannot be undone. All associated reviews and friend connections will also be deleted.`)) {
            setIsLoading(true);
            setError('');
            try {
                await apiService.deleteUser(user_id);
                // After successful deletion, navigate to the users list
                navigate('/', { 
                    state: { 
                        message: `User ${user?.username} has been successfully deleted.` 
                    }
                });
            } catch (err) {
                console.error('Error deleting user:', err);
                setError(`Failed to delete user: ${err.message}`);
                if (err.message.includes('401') || err.message.includes('403')) {
                    navigate('/login');
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleAddFriend = async () => {
        try {
            if (!currentUser || !user_id) {
                setError('Unable to add friend: Missing user information');
                return;
            }
            // Use user.user_id if available, otherwise use user_id from URL
            const friendId = user?.user_id || user_id;
            await apiService.addFriend(currentUser.user_id, friendId);
            // Refresh friends list
            const friendsData = await apiService.getFriends(user_id);
            const friendDetails = await fetchFriendsDetails(friendsData);
            setFriends(friendDetails);
        } catch (err) {
            console.error('Error adding friend:', err);
            // If it's a duplicate entry, just refresh the friends list
            if (err.message.includes('Duplicate entry')) {
                const friendsData = await apiService.getFriends(user_id);
                const friendDetails = await fetchFriendsDetails(friendsData);
                setFriends(friendDetails);
            } else {
                setError(err.message || 'Failed to add friend. Please try again.');
            }
        }
    };

    const handleRemoveFriend = async () => {
        try {
            if (!currentUser || !user_id) {
                setError('Unable to remove friend: Missing user information');
                return;
            }
            if (window.confirm('Are you sure you want to remove this friend?')) {
                // Use user.user_id if available, otherwise use user_id from URL
                const friendId = user?.user_id || user_id;
                await apiService.removeFriend(currentUser.user_id, friendId);
                // Refresh friends list
                const friendsData = await apiService.getFriends(user_id);
                const friendDetails = await fetchFriendsDetails(friendsData);
                setFriends(friendDetails);
            }
        } catch (err) {
            console.error('Error removing friend:', err);
            setError(err.message || 'Failed to remove friend. Please try again.');
        }
    };

    if (isLoading) {
        return <p className="user-detail-loading">Loading user details...</p>;
    }

    if (error) {
        return (
            <div className="user-detail-message-container">
                <p className="user-detail-error-text">{error}</p>
                <button onClick={() => navigate('/')} className="user-detail-button user-detail-button-back">
                    Back Home
                </button>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="user-detail-message-container">
                <p>User not found.</p>
                <button
                    onClick={() => navigate('/')}
                >
                    Back Home
                </button>
            </div>
        );
    }

    const actionErrorDisplay = error ? <p className="user-detail-error-text">{error}</p> : null;
    // Compare user_id as strings (MongoDB IDs are strings, not integers)
    const currentUserId = currentUser?.user_id ? String(currentUser.user_id) : null;
    const profileUserId = user?.user_id ? String(user.user_id) : String(user_id);
    const canEdit = currentUser && (currentUser.admin === 1 || currentUserId === profileUserId);
    const isNotOwnProfile = currentUser && currentUserId !== profileUserId;
    const isFriend = friends.some(friend => {
        const friendUserId = friend.user_id ? String(friend.user_id) : null;
        return friendUserId === currentUserId;
    });

    // Helper to normalize and resolve image URLs
    const resolveImageUrl = (u) => {
        if (!u) return `${API_BASE_URL}/uploads/Default.svg`;
        // Strip legacy "/api" prefix if present
        let url = typeof u === 'string' ? u : String(u);
        if (url.startsWith('/api/')) url = url.slice(4);
        // If relative path, prefix API base; otherwise return as-is
        if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
        return url;
    };

    const profileUrl = resolveImageUrl(user.profile_pic || user.profilePicUrl);

    return (
        <div className="section">
            <NavBar className="navbar"/>
            <div className="user-detail-section user-detail-flex">
                <div className="user-detail-pic-col">
                    <img
                        src={profileUrl}
                        alt={`${user.username}'s profile`}
                        className="user-detail-profile-pic-large"
                    />
                </div>
                <div className="user-detail-info-col">
                    <div className="user-detail-info-list">
                        <div className="user-detail-info-item">
                            <span className="user-detail-label">username</span>
                            <span className="user-detail-value user-detail-username-large">{user.username}</span>
                        </div>
                        <div className="user-detail-info-item">
                            <span className="user-detail-label">Email</span>
                            <span className="user-detail-value">{user.email}</span>
                        </div>
                        <div className="user-detail-info-item">
                            <span className="user-detail-label">Date of birth</span>
                            <span className="user-detail-value">{formatDateLocal(user.dateofbirth)}</span>
                        </div>
                    </div>
                    {canEdit && (
                        <div className="user-detail-actions user-detail-actions-row">
                            <button onClick={() => navigate(`/users/${user.user_id}/edit`)} className="user-detail-icon-btn" title="Edit User">
                                <img src="/uploads/icons/edit.svg" alt="Edit" />
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="user-detail-icon-btn"
                                title="Delete User"
                            >
                                <img src="/uploads/icons/delete.svg" alt="Delete" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {actionErrorDisplay}

            {isNotOwnProfile && !isFriend && (
                <button onClick={handleAddFriend} className="add-friend-button">
                    Add Friend
                </button>
            )}

            {isNotOwnProfile && isFriend && (
                <button onClick={handleRemoveFriend} className="remove-friend-button">
                    Remove Friend
                </button>
            )}

            <div className="friends-section">
                <h3>Friends</h3>
                {friends.length === 0 ? (
                    <p>No friends yet</p>
                ) : (
                    <div className="friends-grid">
                        {friends.map((friend) => {
                            // Ensure friend has user_id
                            const friendUserId = friend.user_id || (friend._id ? friend._id.toString() : null);
                            if (!friendUserId) {
                                console.error('Friend missing user_id:', friend);
                                return null;
                            }
                            return (
                                <Link to={`/users/${friendUserId}`} key={friendUserId} className="friend-card">
                                    <img
                                        src={resolveImageUrl(friend.profile_pic || friend.profilePicUrl)}
                                        alt={`${friend.username}'s profile`}
                                        className="friend-profile-pic"
                                    />
                                    <p>{friend.username}</p>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="home-reviews-container">
                <h3>Reviews</h3>
                {reviews.length === 0 ? (
                    <p>No reviews yet</p>
                ) : (
                    reviews.map((review) => (
                        <Link to={`/reviews/${review.review_id}`} key={review.review_id}>
                            <ReviewCard
                                review={review}
                                username={user?.username}
                                isAuthenticated={isAuthenticated}
                            />
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

export default UserDetailPage;
