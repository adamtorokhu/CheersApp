// Set API URL based on environment

// Prefer explicit env override (set in .env: VITE_API_BASE_URL="http://localhost:3000")
// Use localhost for development, production URL for deployed frontend
VITE_API_BASE_URL || 
    (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.adamtorok.dev');


export default API_BASE_URL;

// Helper to build absolute image URL when needed (e.g., backend-served uploads)
export function buildImageUrl(urlOrPath) {
    if (!urlOrPath) return urlOrPath;
    try {
        // If it's already an absolute URL, return as-is
        if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
        // If it starts with frontend icons, keep as-is
        if (urlOrPath.startsWith('/uploads/icons/')) return urlOrPath;
        // If it starts with backend uploads path, prefix API base URL
        if (urlOrPath.startsWith('/uploads/')) return `${API_BASE_URL}${urlOrPath}`;
        // Otherwise return as-is
        return urlOrPath;
    } catch (e) {
        return urlOrPath;
    }
}

// Handle auth errors and token expiry
const handleAuthError = (status, message) => {
    if (status === 401 || status === 403) {
        throw new Error('Authentication required');
    }
    throw new Error(message);
};

// Process API responses and errors
const handleResponse = async (res, errorMessage) => {
    const data = await res.json();
    if (!res.ok) {
        // Don't log authentication errors
        if (res.status !== 401) {
            console.error('API Error:', data);
        }
        throw new Error(data.message || errorMessage);
    }
    return data;
};

// Auth endpoints
export async function register(username, email, dateofbirth, password) {
    const res = await fetch(`${API_BASE_URL}/users/new`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, dateofbirth, password }),
    });
    const data = await res.json();
    if (!res.ok)
        throw new Error(data.message || 'Registration failed');
    return data;
}

export async function login(email, password) {
    const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    
    if (!res.ok) {
        throw new Error(data.message || 'Login failed');
    }

    if (!data.user) {
        throw new Error('No user data received');
    }

    return data.user;
}

export async function logout() {
    const res = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error('Logout failed');
    }
}

// User management endpoints
export async function getUsers() {
    const res = await fetch(`${API_BASE_URL}/users`, {
        credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok) {throw new Error(data.message || 'Failed to fetch all users')}
    return data
}

export async function getUser(user_id) {
    try {
        const res = await fetch(`${API_BASE_URL}/users/${user_id}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        return handleResponse(res, 'Failed to fetch user');
    } catch (err) {
        console.error('Error in getUser:', err);
        throw err;
    }
}

// Get user info without auth
export async function getPublicUser(user_id) {
    try {
        const res = await fetch(`${API_BASE_URL}/users/${user_id}/public`, {
            headers: { 'Content-Type': 'application/json' }
        });
        return handleResponse(res, 'Failed to fetch user');
    } catch (err) {
        console.error('Error in getPublicUser:', err);
        throw err;
    }
}

export async function createUser(payload) {
    const res = await fetch(`${API_BASE_URL}/users/new`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json()
    if (!res.ok) {throw new Error(data.message || 'Failed to create user')}
    return data
}

export async function updateUser(user_id, updatedUser) {
    const res = await fetch(`${API_BASE_URL}/users/${user_id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
    })
    const data = await res.json()
    if (!res.ok) {throw new Error(data.message || 'Failed to update user')}
    return data
}

export async function deleteUser(user_id) {
    const res = await fetch(`${API_BASE_URL}/users/${user_id}`, {
        method: 'DELETE',
        credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok) {throw new Error(data.message || 'Failed to delete user')}
    return data
}

// Review management endpoints
export async function getReviews() {
    try {
        const res = await fetch(`${API_BASE_URL}/reviews`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        return handleResponse(res, 'Failed to fetch reviews');
    } catch (err) {
        console.error('Error in getReviews:', err);
        throw err;
    }
}

// Filter reviews by user ID
export async function getReviewsByUser(user_id) {
    try {
        if (!user_id) {
            throw new Error('User ID is required');
        }
        const res = await fetch(`${API_BASE_URL}/reviews`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const allReviews = await handleResponse(res, 'Failed to fetch reviews');
        // Filter reviews for the specific user
        return allReviews.filter(review => String(review.user_id) === String(user_id));
    } catch (err) {
        console.error('Error in getReviewsByUser:', err);
        throw err;
    }
}

export async function getReview(review_id) {
    try {
        if (!review_id) {
            throw new Error('Review ID is required');
        }
        const res = await fetch(`${API_BASE_URL}/reviews/${review_id}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        return handleResponse(res, 'Failed to fetch review');
    } catch (err) {
        console.error('Error in getReview:', err);
        throw err;
    }
}

export async function createReview(reviewData) {
    try {
        const res = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        return handleResponse(res, 'Failed to create review');
    } catch (err) {
        console.error('Error in createReview:', err);
        throw err;
    }
}

export async function updateReview(review_id, reviewData) {
    try {
        if (!review_id) {
            throw new Error('Review ID is required');
        }
        const res = await fetch(`${API_BASE_URL}/reviews/${review_id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        return handleResponse(res, 'Failed to update review');
    } catch (err) {
        console.error('Error in updateReview:', err);
        throw err;
    }
}

export async function deleteReview(review_id) {
    try {
        if (!review_id) {
            throw new Error('Review ID is required');
        }
        const res = await fetch(`${API_BASE_URL}/reviews/${review_id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return handleResponse(res, 'Failed to delete review');
    } catch (err) {
        console.error('Error in deleteReview:', err);
        throw err;
    }
}

// Comments API
export async function getComments(reviewId) {
    try {
        if (!reviewId) throw new Error('Review ID is required');
        const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}/comments`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await handleResponse(res, 'Failed to load comments');
        return data.comments || [];
    } catch (err) {
        console.error('Error in getComments:', err);
        throw err;
    }
}

export async function addComment(reviewId, text) {
    try {
        if (!reviewId) throw new Error('Review ID is required');
        const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}/comments`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await handleResponse(res, 'Failed to add comment');
        return data.comment;
    } catch (err) {
        console.error('Error in addComment:', err);
        throw err;
    }
}

export async function deleteComment(reviewId, commentId) {
    try {
        if (!reviewId) throw new Error('Review ID is required');
        if (!commentId) throw new Error('Comment ID is required');
        const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}/comments/${commentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return handleResponse(res, 'Failed to delete comment');
    } catch (err) {
        console.error('Error in deleteComment:', err);
        throw err;
    }
}

// Handle file upload with optional custom filename
export async function uploadImage(file, filename) {
    try {
        if (!file) {
            throw new Error('File is required');
        }
        const formData = new FormData();
        // Important: append filename BEFORE file so multer sees it when naming
        if (filename) {
            formData.append('filename', filename);
        }
        formData.append('file', file);

        const res = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
            headers: {}
        });

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('Authentication required');
            }
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to upload image');
        }

        const data = await res.json();
        // Return relative URL from server; also provide absoluteUrl for convenience
        return {
            ...data,
            // relative path like "/uploads/<file>"
            relativeUrl: data.url,
            // Keep backward compatibility: .url is the relative URL
            url: data.url,
            // Absolute URL constructed for immediate use if needed
            absoluteUrl: `${API_BASE_URL}${data.url}`
        };
    } catch (err) {
        console.error('Error in uploadImage:', err);
        throw err;
    }
}

// Get authenticated user data
export async function getCurrentUser() {
    try {
        const res = await fetch(`${API_BASE_URL}/current-user`, {
            credentials: 'include',
        });
        
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Failed to fetch current user');
        }

        if (!data) {
            throw new Error('No user data received');
        }
        return data;
    } catch (err) {
        // Don't log authentication errors
        if (!err.message?.includes('Authentication required')) {
            console.error('Error in getCurrentUser:', err);
        }
        throw err;
    }
}

// Friend system endpoints
export async function getFriends(userId) {
    try {
        // Backend now uses authenticated user's ID from JWT, so userId param is optional
        // But we'll still send it for backward compatibility if needed
        const url = userId ? `${API_BASE_URL}/friends/${userId}` : `${API_BASE_URL}/friends/current`;
        const res = await fetch(url, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Failed to fetch friends');
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
            console.error('Unexpected friends data format:', data);
            return [];
        }

        return data;
    } catch (err) {
        console.error('Error in getFriends:', err);
        return [];
    }
}

export async function addFriend(userId, friendId) {
    try {
        if (!friendId) {
            throw new Error('friendId is required');
        }
        // Backend now uses authenticated user's ID from JWT, so only send friendId
        const res = await fetch(`${API_BASE_URL}/friends/add`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendId })
        });
        return handleResponse(res, 'Failed to add friend');
    } catch (err) {
        console.error('Error in addFriend:', err);
        throw err;
    }
}

// Get reviews from user's friends
export async function getFriendsReviews() {
    try {
        // First get the current user
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            console.error('No current user found');
            throw new Error('Not authenticated');
        }

        // Get the user's friends
        const friends = await getFriends(currentUser.user_id);
        
        if (!friends || !Array.isArray(friends)) {
            console.error('Invalid friends response:', friends);
            return [];
        }
        
        // Get all reviews
        const allReviews = await getReviews();
        
        // Filter reviews to only include those from friends
        const friendsReviews = allReviews.filter(review => {
            // Get the review author's ID
            const reviewUserId = review.user_id;
            
            // Check if the review author is in the friends list
            return friends.some(friendship => {
                // If current user is friend1, check if review is from friend2
                if (friendship.friend1 === currentUser.user_id) {
                    return friendship.friend2 === reviewUserId;
                }
                // If current user is friend2, check if review is from friend1
                if (friendship.friend2 === currentUser.user_id) {
                    return friendship.friend1 === reviewUserId;
                }
                return false;
            });
        });
        
        return friendsReviews;
    } catch (err) {
        console.error('Error in getFriendsReviews:', err);
        throw err;
    }
}

export async function removeFriend(userId, friendId) {
    try {
        if (!friendId) {
            throw new Error('friendId is required');
        }
        // Backend now uses authenticated user's ID from JWT, so only send friendId
        const res = await fetch(`${API_BASE_URL}/friends/remove`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendId })
        });
        return handleResponse(res, 'Failed to remove friend');
    } catch (err) {
        console.error('Error in removeFriend:', err);
        throw err;
    }
}

// Review interaction endpoints
export async function toggleCheer(reviewId) {
    try {
        if (!reviewId) {
            throw new Error('Review ID is required');
        }
        const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}/cheer`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        return handleResponse(res, 'Failed to toggle cheer');
    } catch (err) {
        console.error('Error in toggleCheer:', err);
        throw err;
    }
}

export async function getCheerStatus(reviewId) {
    try {
        if (!reviewId) {
            throw new Error('Review ID is required');
        }
        const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}/cheer`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        return handleResponse(res, 'Failed to get cheer status');
    } catch (err) {
        console.error('Error in getCheerStatus:', err);
        throw err;
    }
}

export async function getCheerers(reviewId) {
    try {
        if (!reviewId) {
            throw new Error('Review ID is required');
        }
        const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}/cheerers`, {
            headers: { 'Content-Type': 'application/json' }
        });
        return handleResponse(res, 'Failed to get cheerers');
    } catch (err) {
        console.error('Error in getCheerers:', err);
        throw err;
    }
}
