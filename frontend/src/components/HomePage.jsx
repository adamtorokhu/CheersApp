import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from "./NavBar"
import * as apiService from '../services/apiService';
import "../index.css"
import ReviewCard from "./ReviewCard"
import ReviewButton from "./ReviewButton.jsx";

function HomePage() {
    const [reviews, setReviews] = useState([]);
    const [usernames, setUsernames] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState('discover'); // 'discover' or 'friends'
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAllReviews = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiService.getReviews();
            setReviews(data);
            await fetchUsernames(data);
        } catch (err) {
            setError('Failed to load reviews. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchFriendsReviews = async () => {
        setLoading(true);
        setError('');
        try {
            const friendsReviews = await apiService.getFriendsReviews();
            setReviews(friendsReviews);
            await fetchUsernames(friendsReviews);
        } catch (err) {
            setError('Failed to load friends\' reviews. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsernames = async (reviewsData) => {
        try {
            const usernamePromises = reviewsData.map(review => 
                review.user_id ? apiService.getPublicUser(review.user_id) : null
            );
            
            const users = await Promise.all(usernamePromises);
            const usernameMap = {};
            users.forEach((user, index) => {
                if (user && reviewsData[index].user_id) {
                    usernameMap[reviewsData[index].user_id] = user.username;
                }
            });
            setUsernames(usernameMap);
        } catch (err) {
            console.error('Error fetching usernames:', err);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await apiService.getCurrentUser();
                setCurrentUser(user);
                setIsAuthenticated(true);
            } catch (err) {
                setCurrentUser(null);
                setIsAuthenticated(false);
            }
        };
        checkAuth();
        fetchAllReviews();
    }, []);

    const handleViewChange = (view) => {
        if (view === 'friends' && !currentUser) {
            return; // Do nothing if trying to switch to friends view while not logged in
        }
        setActiveView(view);
        setSearchQuery(''); // reset search when switching views
        if (view === 'discover') {
            fetchAllReviews();
        } else if (view === 'friends') {
            fetchFriendsReviews();
        }
    };

    const filteredReviews = reviews.filter(r => {
        if (!searchQuery.trim()) return true;
        const name = (r.name || '').toString().toLowerCase();
        return name.includes(searchQuery.trim().toLowerCase());
    });

    return (
        <div>
            <NavBar className="navbar"/>
            <div className="home-btn-row">
                <button 
                    className={`discover ${activeView === 'discover' ? 'active' : ''}`}
                    onClick={() => handleViewChange('discover')}
                >
                    Discover
                </button>
                <button 
                    className={`friends ${activeView === 'friends' ? 'active' : ''}`}
                    onClick={() => handleViewChange('friends')}
                    disabled={!currentUser}
                    title={!currentUser ? "Please log in to view friends' reviews" : ""}
                >
                    Friends
                </button>
            </div>

            {/* Search input */}
            <div className="home-search-row" style={{ padding: '0 16px', marginBottom: '12px' }}>
                <input
                    type="text"
                    placeholder="Search reviews by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="friend-search"
                    style={{ maxWidth: 480, width: '100%' }}
                />
            </div>

            {loading && <div>Loading reviews...</div>}
            {error && <div className="error-message">{error}</div>}
            <div className="home-reviews-container">
                {filteredReviews.length === 0 ? (
                    <div className="no-reviews-message">No reviews found</div>
                ) : (
                    filteredReviews.map((review) => (
                        <Link to={`/reviews/${review.review_id}`} key={review.review_id}>
                            <ReviewCard
                                review={review}
                                username={usernames[review.user_id]}
                                isAuthenticated={isAuthenticated}
                                />
                        </Link>
                    ))
                )}
            </div>
            <ReviewButton />
        </div>
    )
}

export default HomePage