import {useState} from "react";
import {useNavigate} from "react-router-dom";
import * as apiService from "../services/apiService.js";
import NavBar from "./NavBar"
import '../index.css'

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await apiService.login(email, password);
            const user = await apiService.getCurrentUser();
            navigate(`/`);
        } catch (error) {
            setError('Wrong Email or Password');
        }
    }

    return (
        <div className="login-page-bg">
            <NavBar />
            <div className="login-hero">
                <div className="login-hero-content">
                    <div className="login-text-section">
                        <h1 className="login-title">Login now!</h1>
                        <p className="login-subtitle">Welcome! Please login to access all the features.</p>
                    </div>
                    <div className="login-card">
                        <form className="login-form" onSubmit={handleLogin}>
                            {error && (
                                <div className="login-error">
                                    <span>{error}</span>
                                </div>
                            )}
                            <div className="login-form-group">
                                <label className="login-label">
                                    <span>Email</span>
                                </label>
                                <input 
                                    type="email" 
                                    placeholder="email" 
                                    className="login-input" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="login-form-group">
                                <label className="login-label">
                                    <span>Password</span>
                                </label>
                                <input 
                                    type="password" 
                                    placeholder="password" 
                                    className="login-input" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="login-form-actions">
                                <button className="login-btn" type="submit">Login</button>
                            </div>
                            <div className="login-divider">OR</div>
                            <button 
                                className="login-btn-outline" 
                                type="button"
                                onClick={() => navigate('/users/new')}
                            >
                                Create new account
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage