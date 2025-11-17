import React, { useState, useEffect } from "react";
import * as apiService from '../services/apiService';

function formatDate(dateString) {
    const date = new Date(dateString);
    const pad = (n) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function ReviewCard({ review, username, isAuthenticated }) {
    const [currentReview, setCurrentReview] = useState(review);
    const [hasCheered, setHasCheered] = useState(false);

    useEffect(() => {
        // Only check cheer status if user is authenticated
        const checkCheerStatus = async () => {
            if (!isAuthenticated) return;
            
            try {
                const response = await apiService.getCheerStatus(review.review_id);
                setHasCheered(response.hasCheered);
            } catch (error) {
                console.error('Error checking cheer status:', error);
            }
        };

        checkCheerStatus();
    }, [review.review_id, isAuthenticated]);

    const handleCheerClick = async (e) => {
        e.stopPropagation(); // Prevent the click from bubbling up
        e.preventDefault(); // Prevent any default behavior
        
        if (!isAuthenticated) {
            // Optionally show a message to the user that they need to log in
            alert('Please log in to cheer for reviews');
            return;
        }

        try {
            const response = await apiService.toggleCheer(review.review_id);
            setCurrentReview(response.review);
            setHasCheered(response.hasCheered);
        } catch (error) {
            console.error('Error toggling cheer:', error);
        }
    };

    return (
        <div className="review-card">
            <div className="review-header">
                <img
                    src={apiService.buildImageUrl(currentReview.review_pic) || '/uploads/icons/DefaultReview.svg'}
                    alt={`${currentReview.name} beer`}
                    className="review-pic"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/uploads/icons/DefaultReview.svg';
                    }}
                />
            </div>
            <div className="review-info">
                <div className="review-top-line">
                    {username && (
                        <div className="review-section">
                            <p>@{username}</p>
                        </div>
                    )}
                    {currentReview.location && (
                        <div className="review-section user-location">
                            <span role="img" aria-label="location">📍</span>
                            <span>{currentReview.location}</span>
                        </div>
                    )}
                </div>
                <div className="review-header">
                    <h1>{currentReview.name}</h1>
                    <div className="beer-type">
                        <span>🍺 {currentReview.style}</span>
                    </div>
                    <div className="rating">
                        <img src="/uploads/icons/star.svg" alt=""/>
                        <span className="rating-value">{currentReview.rating}</span>
                        <span className="rating-max">/5.0</span>
                    </div>
                    <div className="review-section">
                        <p>{formatDate(currentReview.date)}</p>
                    </div>
                    <div className='social' onClick={(e) => e.stopPropagation()}>
                        <img
                            className="cheers-button"
                            src={hasCheered ? "/uploads/icons/cheersd.svg" : "/uploads/icons/cheers.svg"}
                            alt="Cheers"
                            onClick={handleCheerClick}
                        />
                        <p>{currentReview.cheers || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReviewCard;