import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import LoginPage from './components/loginPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import UserFormPage from "./components/UserFormPage";
import UserDetailPage from "./components/UserDetailPage";
import UsersListPage from "./components/UsersListPage";
import HomePage from './components/HomePage'
import ReviewFormPage from './components/ReviewFormPage.jsx';
import ReviewDetailPage from './components/ReviewDetailPage';
import AddFriends from './components/AddFriends.jsx';

function App() {
    return (
        <Router>
            <Routes>
                <Route path ='/' element = {<HomePage/>}/>
                <Route path ='/login' element = {<LoginPage/>}/>
                <Route path ='/users/new' element ={<UserFormPage type='new' />}/>

                <Route path ='/users' element ={
                    <ProtectedRoute>
                        <AdminRoute>
                            <UsersListPage/>
                        </AdminRoute>
                    </ProtectedRoute>
                }/>

                <Route path ='/users/:user_id' element ={
                    <ProtectedRoute>
                        <UserDetailPage/>
                    </ProtectedRoute>
                }/>

                <Route path ='/users/:user_id/edit' element ={
                    <ProtectedRoute>
                        <UserFormPage type='edit' />
                    </ProtectedRoute>
                }/>

                <Route path="/reviews/new" element={
                    <ProtectedRoute>
                    <ReviewFormPage type='new' />
                    </ProtectedRoute>
                } />
                <Route path="/reviews/:review_id" element={<ReviewDetailPage />} />
                <Route path="/reviews/:review_id/edit" element={<ReviewFormPage type='edit' />} />

                <Route path="/friends" element={
                    <ProtectedRoute>
                        <AddFriends />
                    </ProtectedRoute>
                } />

            </Routes>
        </Router>
    )
}

export default App
