import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as apiService from "../services/apiService.js";
import ImageUpload from "./ImageUpload";
import '../index.css'
import NavBar from "./NavBar.jsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, isValid, subYears, format as formatDateFns } from 'date-fns';
import { FaRegCalendarAlt } from 'react-icons/fa';

function UserFormPage({ type }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        dateofbirth: null,
        password: '',
        newPassword: '',
        profileImage: null,
    });
    const imageUploadRef = useRef();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user_id } = useParams();

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    useEffect(() => {
        if (type === 'edit' && user_id) {
            setIsLoading(true);
            apiService.getUser(user_id)
                .then(userData => {
                    setFormData({
                        username: userData.username || '',
                        email: userData.email || '',
                        dateofbirth: userData.dateofbirth && isValid(new Date(userData.dateofbirth)) ? new Date(userData.dateofbirth) : null,
                        password: '',
                        newPassword: '',
                    });
                    setIsLoading(false);
                })
                .catch(err => {
                    setError(`Failed to load user data: ${err.message}`);
                    if (err.message.includes('401') || err.message.includes('403')) {
                        navigate('/login');
                    }
                    setIsLoading(false);
                });
        } else if (type === 'new') {
            setFormData({
                username: '', dateofbirth: null, email: '', password: '', newPassword: '',
            });
        }
    }, [type, user_id, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let imageData = null;
            if (formData.profileImage?.file) {
                try {
                    imageData = await apiService.uploadImage(formData.profileImage.file, formData.username);
                    console.log('Image upload response:', imageData); // Debug log
                } catch (err) {
                    if (err.message === 'Authentication required') {
                        navigate('/login');
                        return;
                    }
                    throw new Error(`Image upload failed: ${err.message}`);
                }
            }

            if (type === 'edit' && user_id) {
                const payload = {
                    username: formData.username,
                    email: formData.email,
                    dateofbirth: formData.dateofbirth ? formatDateFns(formData.dateofbirth, 'yyyy-MM-dd') : '',
                    user_id: user_id // Make sure user_id is included
                };
                if (formData.newPassword) {
                    payload.password = formData.newPassword;
                }
                if (imageData && imageData.url) {
                    payload.profileImage = {
                        url: imageData.url
                    };
                }
                console.log('Update payload:', payload); // Debug log
                await apiService.updateUser(user_id, payload);
                navigate(`/users/${user_id}`);
            } else {
                if (!formData.password) {
                    setError("Password is required for new users.");
                    setIsLoading(false);
                    return;
                }
                const payload = {
                    username: formData.username,
                    email: formData.email,
                    dateofbirth: formData.dateofbirth ? formatDateFns(formData.dateofbirth, 'yyyy-MM-dd') : '',
                    password: formData.password
                };
                if (imageData && imageData.url) {
                    payload.profileImage = {
                        url: imageData.url
                    };
                }
                console.log('Create payload:', payload); // Debug log
                await apiService.createUser(payload);
                navigate('/users');
            }
        } catch (err) {
            console.error('Submit error:', err); // Debug log
            setError(`Operation failed: ${err.message}`);
            if (err.message.includes('Authentication required')) {
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleDateChange = (date) => {
        setFormData(prevData => ({
            ...prevData,
            dateofbirth: date
        }));
    };

    const handleImageUpload = (imageData) => {
        if (imageData.status === 'selected') {
            setFormData(prevData => ({
                ...prevData,
                profileImage: {
                    file: imageData.file,
                    preview: imageData.preview,
                    status: 'selected'
                }
            }));
        }
    };

    const handleCancel = () => {
        if (type === 'edit' && user_id) {
            navigate(`/users/${user_id}`);
        } else {
            navigate('/login');
        }
    };

    if (isLoading && type === 'edit' && !formData.email) {
        return <p>Loading user data...</p>;
    }

    return (
        <div className="userform-page-bg">
            <NavBar />
            <div className="userform-hero">
                <div className="userform-hero-content">
                    <div className="userform-text-section">
                        <h2 className="userform-title">{type === 'edit' ? 'Edit User' : 'Create new account'}</h2>
                        <p className="userform-p">{type === 'edit' ? 'Change your profile information!' : "It's just a few steps!"}</p>
                    </div>
                    <div className="userform-card">
                        {error && <div className="userform-error">{error}</div>}
                        <form className="userform-form" onSubmit={handleSubmit}>
                            <div className="userform-form-group">
                                <label className="userform-label" htmlFor="profileImage">Profile Image:</label>
                                <ImageUpload
                                    ref={imageUploadRef}
                                    onImageUpload={handleImageUpload}
                                    initialPreview={formData.profileImage?.preview}
                                    filename={formData.username}
                                />
                            </div>
                            <div className="userform-form-group">
                                <label className="userform-label" htmlFor="username">Username:</label>
                                <input className="userform-input" type="text" id="username" name="username" value={formData.username} onChange={handleChange} required/>
                            </div>
                            <div className="userform-form-group">
                                <label className="userform-label" htmlFor="email">Email:</label>
                                <input className="userform-input" type="email" id="email" name="email" value={formData.email} onChange={handleChange} required/>
                            </div>
                            <div className="userform-form-group">
                                <label className="userform-label" htmlFor="dateofbirth">Date of birth:</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <DatePicker
                                        className="userform-input"
                                        id="dateofbirth"
                                        name="dateofbirth"
                                        selected={formData.dateofbirth}
                                        onChange={handleDateChange}
                                        dateFormat="yyyy-MM-dd"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        maxDate={subYears(new Date(), 18)}
                                        minDate={subYears(new Date(), 120)}
                                        placeholderText="Select your date of birth"
                                        required
                                        aria-label="Date of birth, must be at least 18 years old"
                                        isClearable
                                        todayButton="Today"
                                        popperPlacement="bottom"
                                        calendarStartDay={1}
                                    />
                                    <FaRegCalendarAlt style={{ position: 'absolute', right: 12, pointerEvents: 'none', color: '#FBB117', fontSize: 22 }} />
                                </div>
                                <small style={{ color: '#888', marginTop: 4, display: 'block' }}>
                                    You must be at least 18 years old to register.
                                </small>
                            </div>
                            {type === 'new' && (
                                <div className="userform-form-group">
                                    <label className="userform-label" htmlFor="password">Password:</label>
                                    <input className="userform-input" type="password" id="password" name="password" value={formData.password} onChange={handleChange} required/>
                                </div>
                            )}

                            {type === 'edit' && (
                                <div className="userform-form-group">
                                    <label className="userform-label" htmlFor="newPassword">New Password (leave blank to keep current):</label>
                                    <input className="userform-input" type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleChange}/>
                                </div>
                            )}

                            <div className="userform-form-actions">
                                <button className="userform-btn" type="submit" disabled={isLoading}>
                                    {type === 'edit' ? 'Update User' : 'Create User'}
                                </button>
                                <button className="userform-btn-outline" type="button" onClick={handleCancel} disabled={isLoading}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserFormPage;
