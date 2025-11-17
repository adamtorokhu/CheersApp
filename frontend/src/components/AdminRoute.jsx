import { Navigate } from "react-router-dom";
import * as apiService from "../services/apiService.js";
import { useState, useEffect } from "react";

function AdminRoute({ children }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const currentUser = await apiService.getCurrentUser();
                setIsAdmin(currentUser.admin === 1);
            } catch (error) {
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAdmin();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default AdminRoute; 