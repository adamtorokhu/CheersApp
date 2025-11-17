import { useNavigate, useLocation } from 'react-router-dom';
import '../index.css'
import * as apiService from '../services/apiService';
import { useState, useEffect } from 'react';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const currentPath = location.pathname;
    const isProfilePage = currentPath.startsWith('/users/');
    const isPublicRoute = currentPath === '/login' || 
                         currentPath === '/users/new' || 
                         currentPath === '/' || 
                         currentPath.startsWith('/reviews/') ||
                         currentPath === '/about';
    
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const user = await apiService.getCurrentUser();
                setCurrentUser(user);
            } catch (err) {
                // Don't log error for authentication required
                if (!err.message?.includes('Authentication required')) {
                    console.error('Failed to fetch current user:', err);
                }
                setCurrentUser(null);
                if (!isPublicRoute) {
                    navigate('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchCurrentUser();
    }, [navigate, isPublicRoute]);

    const handleProfileClick = async () => {
        try {
            const user = await apiService.getCurrentUser();
            if (user) {
                if (user.admin === 1) {
                    navigate('/users'); // Redirect to users list if admin
                } else {
                    navigate(`/users/${user.user_id}`); // Redirect to profile if not admin
                }
            } else {
                navigate('/login');
            }
        } catch (err) {
            console.error('Profile navigation failed:', err);
            navigate('/login');
        }
    };

    async function handleLogout() {
        try {
            await apiService.logout();
            setCurrentUser(null);
            navigate('/');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    }

    // Check if we're on the current user's profile page
    const isOwnProfile = currentUser && isProfilePage && currentPath === `/users/${currentUser.user_id}`;

    // Don't show anything while loading on protected routes
    if (isLoading && !isPublicRoute) {
        return null;
    }

    return (
        <nav className="navbar">
            <img className="navbar-logo" alt="logo" src="/uploads/icons/logo.png" onClick={() => navigate('/')}/>
            <div className="navbar-icons">
                {currentUser ? (
                    <>
                        <img src="/uploads/icons/friend.svg" alt="friends button" onClick={() => navigate('/friends')} />
                        {/*<img src="/uploads/icons/review.svg" alt="Review button" onClick={() => navigate('/reviews/new')} />*/}
                        {isOwnProfile ? (
                            <img src="/uploads/icons/logout.svg" alt="Logout button" onClick={handleLogout} />
                        ) : (
                            <img src="/uploads/icons/profile.svg" alt="Profile button" onClick={handleProfileClick} />
                        )}
                    </>
                ) : (
                    <>
                        {/* Always show these buttons for non-authenticated users */}
                        <img src="/uploads/icons/profile.svg" alt="Login button" onClick={() => navigate('/login')} />
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;