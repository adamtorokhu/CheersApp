import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from "./NavBar.jsx";
import * as apiService from '../services/apiService';

const getCityFromCoords = async (lat, lon) => {
    // Using OpenStreetMap Nominatim API (no key required, but rate-limited)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        return data.address?.city || data.address?.town || data.address?.village || data.address?.state || '';
    } catch (err) {
        return '';
    }
};

const ReviewFormPage = ({ type }) => {
    const navigate = useNavigate();
    const { review_id } = useParams();
    const [formData, setFormData] = useState({
        name: '',
        style: '',
        rating: 0,
        image: null,
        location: ''
    });
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (type === 'edit' && review_id) {
            setIsLoading(true);
            apiService.getReview(review_id)
                .then(data => {
                    setFormData({
                        name: data.name || '',
                        style: data.style || '',
                        rating: data.rating || 0,
                        image: null,
                        location: data.location || ''
                    });
                    if (data.review_pic) {
                        setImagePreview(data.review_pic);
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    if (err.message === 'Authentication required') {
                        // The apiService will handle the redirect
                        return;
                    }
                    setError(`Failed to load review: ${err.message}`);
                    setIsLoading(false);
                });
        }
    }, [type, review_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rating' ? parseFloat(value) : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.match(/^image\/(jpeg|png|gif)$/i)) {
                setError('Only JPG, PNG, and GIF images are allowed.');
                e.target.value = null;
                return;
            }
            setFormData(prev => ({
                ...prev,
                image: file
            }));
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setError(''); // Clear any previous errors
        }
    };

    const handleLocate = async () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setIsLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const city = await getCityFromCoords(latitude, longitude);
            setFormData(prev => ({ ...prev, location: city }));
            setIsLocating(false);
        }, (err) => {
            setError('Unable to retrieve your location.');
            setIsLocating(false);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // First, upload the image if one was selected
            let imageUrl = null;
            if (formData.image) {
                try {
                    const imageData = await apiService.uploadImage(formData.image, formData.name);
                    if (imageData && imageData.url) {
                        imageUrl = imageData.url;
                    }
                } catch (err) {
                    if (err.message === 'Authentication required') {
                        // The apiService will handle the redirect
                        return;
                    }
                    setError('Failed to upload image. Please try again.');
                    setIsLoading(false);
                    return;
                }
            }

            const reviewData = {
                name: formData.name,
                style: formData.style,
                rating: formData.rating,
                user_id: 1, // This should come from your authentication context
                review_pic: imageUrl || (type === 'edit' && !formData.image ? imagePreview : null),
                location: formData.location
            };

            let data;
            if (type === 'edit') {
                data = await apiService.updateReview(review_id, reviewData);
            } else {
                data = await apiService.createReview(reviewData);
            }

            if (data && data.review_id) {
                navigate(`/reviews/${data.review_id}`);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            if (err.message === 'Authentication required') {
                // The apiService will handle the redirect
                return;
            }
            setError(`Operation failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && type === 'edit') {
        return (
            <div className="review-form-container">
                <NavBar className="navbar"/>
                <div className="review-card">
                    <div className="review-header">
                        <h1>Loading review data...</h1>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="review-form-page-bg">
            <NavBar className="navbar"/>
            <div className="userform-hero">
                <div className="userform-hero-content">
                    <div className="userform-text-section">
                        <h2 className="userform-title">{type === 'edit' ? 'Edit Review' : 'Add New Review'}</h2>
                        <p className="userform-p">Share your beer experience with the community!</p>
                    </div>
                    <div className="userform-card">
                        {error && <div className="userform-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="userform-form">
                            <div className="userform-form-group">
                                <label htmlFor="name" className="userform-label">Beer Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="userform-input"
                                />
                            </div>

                            <div className="userform-form-group">
                                <label htmlFor="style" className="userform-label">Beer Style</label>
                                <select
                                    id="style"
                                    name="style"
                                    value={formData.style}
                                    onChange={handleChange}
                                    required
                                    className="userform-input"
                                >
                                    <option value="">Select a style</option>
                                    <option value="IPA">IPA</option>
                                    <option value="Stout">Stout</option>
                                    <option value="Pale Ale">Pale Ale</option>
                                    <option value="Lager">Lager</option>
                                    <option value="Pilsner">Pilsner</option>
                                    <option value="Wheat Beer">Wheat Beer</option>
                                    <option value="Sour">Sour</option>
                                    <option value="Dark Beer">Dark Beer</option>
                                </select>
                            </div>

                            <div className="userform-form-group">
                                <label htmlFor="rating" className="userform-label">Rating (0-5)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="5"
                                    step="0.5"
                                    id="rating"
                                    name="rating"
                                    value={formData.rating}
                                    onChange={handleChange}
                                    className="slider"
                                />
                                <span className="slider-value">{formData.rating}</span>
                            </div>

                            <div className="userform-form-group">
                                <label htmlFor="image" className="userform-label">Beer Image (JPG, PNG, or GIF)</label>
                                <input
                                    type="file"
                                    id="image"
                                    name="image"
                                    accept="image/jpeg,image/png,image/gif"
                                    onChange={handleImageChange}
                                    className="userform-input"
                                />
                                {imagePreview && (
                                    <div className="image-preview">
                                        <img src={imagePreview} alt="Preview" className="review-image-preview" />
                                    </div>
                                )}
                            </div>

                            <div className="userform-form-group">
                                <label htmlFor="location" className="userform-label">Location</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="Location"
                                        className="userform-input"
                                        style={{ flex: 1 }}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleLocate} 
                                        disabled={isLocating} 
                                        className="userform-btn"
                                        style={{ width: 'auto', whiteSpace: 'nowrap', padding: '0 15px' }}
                                    >
                                        {isLocating ? 'Detecting...' : 'Detect City'}
                                    </button>
                                </div>
                            </div>

                            <div className="userform-form-actions">
                                <button type="submit" className="userform-btn" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : (type === 'edit' ? 'Update Review' : 'Submit Review')}
                                </button>
                                <button type="button" onClick={() => navigate(-1)} className="userform-btn-outline" disabled={isLoading}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewFormPage;