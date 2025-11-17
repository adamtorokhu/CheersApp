import React, { useState, useEffect } from 'react';
import NavBar from './NavBar.jsx';
import * as apiService from '../services/apiService.js';
import API_BASE_URL from '../services/apiService.js';
import { Link } from 'react-router-dom';

function AddFriends() {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get current user
                const user = await apiService.getCurrentUser();
                setCurrentUser(user);

                // Get all users except admins and current user
                const allUsers = await apiService.getUsers();
                const nonAdminUsers = allUsers.filter(u => {
                    // Exclude current user and admins
                    // Users now have user_id from backend transformation
                    return u.user_id !== user.user_id && u.admin !== 1;
                });

                // Get current user's friends
                const friendsData = await apiService.getFriends(user.user_id);
                setFriends(friendsData);

                setUsers(nonAdminUsers);
            } catch (error) {
                console.error('Error loading data:', error);
                setError('Failed to load users. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleAddFriend = async (friendId) => {
        try {
            if (!currentUser) {
                throw new Error('Please log in to add friends');
            }
            if (!friendId) {
                console.error('friendId is undefined:', friendId);
                throw new Error('Friend ID is missing');
            }
            console.log('Adding friend:', { currentUserId: currentUser.user_id, friendId });
            await apiService.addFriend(currentUser.user_id, friendId);
            // Refresh friends list
            const friendsData = await apiService.getFriends(currentUser.user_id);
            setFriends(friendsData);
        } catch (error) {
            console.error('Error adding friend:', error);
            if (!error.message.includes('Duplicate entry')) {
                alert(error.message || 'Failed to add friend. Please try again.');
            }
            // Refresh friends list even on duplicate entry
            const friendsData = await apiService.getFriends(currentUser.user_id);
            setFriends(friendsData);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        try {
            if (!currentUser) {
                throw new Error('Please log in to remove friends');
            }
            if (window.confirm('Are you sure you want to remove this friend?')) {
                await apiService.removeFriend(currentUser.user_id, friendId);
                // Refresh friends list
                const friendsData = await apiService.getFriends(currentUser.user_id);
                setFriends(friendsData);
            }
        } catch (error) {
            console.error('Error removing friend:', error);
            alert(error.message || 'Failed to remove friend. Please try again.');
        }
    };

    const isFriend = (userId) => {
        if (!currentUser || !friends) return false;
        // Users now have user_id from backend transformation
        return friends.some(friendship => {
            const friend1 = friendship.friend1 ? friendship.friend1.toString() : friendship.friend1;
            const friend2 = friendship.friend2 ? friendship.friend2.toString() : friendship.friend2;
            return (friend1 === userId && friend2 === currentUser.user_id) ||
                   (friend2 === userId && friend1 === currentUser.user_id);
        });
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Filter users based on search query
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div>
                <NavBar />
                <div>
                    <p>Loading users...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <NavBar />
                <div>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <NavBar />
            <div className="friend-page">
                <h1>Add Friends</h1>
                <input
                    type="text"
                    placeholder="Search friends by username..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="friend-search"
                />
                <ul>
                    {filteredUsers.map(user => {
                        // Ensure user_id exists
                        const userId = user.user_id || (user._id ? user._id.toString() : null);
                        if (!userId) {
                            console.error('User missing user_id:', user);
                            return null;
                        }
                        return (
                            <li key={userId} className="friend-list">
                                <Link to={`/users/${userId}`} className='friend-link'>
                                    <div className="friend-profile-pic">
                                    {(() => {
                                        const resolveImageUrl = (u) => {
                                            if (!u) return `${API_BASE_URL}/uploads/Default.svg`;
                                            let url = typeof u === 'string' ? u : String(u);
                                            if (url.startsWith('/api/')) url = url.slice(4);
                                            if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
                                            return url;
                                        };
                                        const pic = resolveImageUrl(user.profile_pic || user.profilePicUrl);
                                        return (
                                            <img
                                                src={pic}
                                                alt={`${user.username}'s profile`}
                                                className="user-detail-profile-pic"
                                            />
                                        );
                                    })()}
                                    </div>
                                    <div className='friend-username'><p>{user.username}</p></div>
                                </Link>
                                {isFriend(userId) ? (
                                    <button
                                        onClick={() => handleRemoveFriend(userId)}
                                        className="remove-friend-button"
                                    >
                                        Remove Friend
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAddFriend(userId)}
                                        className="add-friend-button"
                                    >
                                        Add Friend
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default AddFriends; 
