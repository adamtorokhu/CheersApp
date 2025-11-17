import { useNavigate } from 'react-router-dom';
import '../index.css'

function ReviewButton() {
    const navigate = useNavigate();

    return (
        <button
            className="review-btn"
            onClick={() => navigate('/reviews/new')}
            aria-label="Create new review"
        >
            <img src="/uploads/icons/review1.svg" alt="Review button" />
        </button>
    );
}

export default ReviewButton;