import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as apiService from '../services/apiService';
import NavBar from "./NavBar.jsx";
import '../index.css';

function UsersListPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return new Date(dateString).toISOString().split('T')[0];
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // First check if user is admin
                const currentUser = await apiService.getCurrentUser();
                if (currentUser.admin !== 1) {
                    setError('Access denied. Admin privileges required.');
                    setLoading(false);
                    return;
                }
                setIsAdmin(true);

                // If admin, fetch users
                const data = await apiService.getUsers();
                setUsers(data);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
                if (error.message.includes('401') || error.message.includes('403')) {
                    navigate('/login');
                }
            }
        };

        fetchData();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await apiService.logout();
            navigate('/');
        } catch (error) {
            setError('Logout failed: ' + error.message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return (
        <div className="section">
            <NavBar className="navbar"/>
            <div className="error-message">Error: {error}</div>
            <button onClick={() => navigate('/')} className="back-button">
                Back to Home
            </button>
        </div>
    );

    if (!isAdmin) return (
        <div className="section">
            <NavBar className="navbar"/>
            <div className="error-message">Access denied. Admin privileges required.</div>
            <button onClick={() => navigate('/')} className="back-button">
                Back to Home
            </button>
        </div>
    );

    return (
        <div className="section">
            <NavBar className="navbar"/>
            <div className="users-header">
                <h2>Users List</h2>
                <div className="users-actions">
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                    <Link to="/users/new" className="add-btn">Add New User</Link>
                </div>
            </div>

            <ul className="users-list">
                {users.map(user => (
                    <li key={user.user_id} className="user-item">
                        <Link to={`/users/${user.user_id}`}>
                            <div className="user-name">{user.username}</div>
                            <div className="user-email">{user.email}</div>
                            <div className="user-date">Born: {formatDate(user.dateofbirth)}</div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default UsersListPage;