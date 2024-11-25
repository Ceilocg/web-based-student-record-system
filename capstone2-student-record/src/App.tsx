import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig'; // Firebase import
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import UserManagement from './pages/UserManagement';
import AddUserPage from './pages/AddUser';
import FormTemplates from './pages/FormTemplates';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RequestForm from './pages/RequestForm';
import Notifications from './pages/Notifications';
import Grades from './pages/Grades/Grades'
import { AuthProvider } from './context/AuthContext';
import AboutUs from './pages/AboutUs';
import Information from './pages/Information';
import SectionList from './pages/Enrollment/sections';
import StudentGrades from './pages/DataManagementComponents/studentgrade';
import EnrollmentForm from './pages/Enrollment/Enrollees';
import Dropouts from './pages/Dropouts/Dropouts';



const App: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState<'Admin' | 'Adviser' | 'Faculty' | null>(null);
    const [loading, setLoading] = useState(true);

    const toggleSidebar = () => {
        setIsCollapsed(prevState => !prevState);
    };

    // Handle window resize to toggle sidebar
    useEffect(() => {
        const handleResize = () => {
            setIsCollapsed(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch user role from Firestore when user is authenticated
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuthenticated(true);
                // Fetch the user's role from Firestore
                const userRef = doc(db, 'users', user.uid); // Assuming user collection is named 'users'
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const role = userDoc.data()?.role; // Assuming role is stored as 'role'
                    setUserRole(role || null);
                }
            } else {
                setIsAuthenticated(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <AuthProvider>
                <BrowserRouter>
                    <div className="flex flex-col min-h-screen">
                        <div className="flex flex-1">
                            {isAuthenticated && userRole ? (
                                <>
                                    <Sidebar isCollapsed={isCollapsed} role={userRole} />
                                    <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                                        <Navbar onToggleSidebar={toggleSidebar} />
                                        <div className="flex-1">
                                            <Routes>
                                                <Route path="/" element={<Home />} />
                                                <Route path="/user-management" element={<UserManagement />} />
                                                <Route path="/add-user" element={<AddUserPage />} />
                                                <Route path="/form-templates" element={<FormTemplates />} />
                                                <Route path="/grades" element={<Grades />} />
                                                <Route path="/enrollment" element={<EnrollmentForm />} />
                                                <Route path="/studentgrade/:studentId" element={<StudentGrades />} /> {/* Dynamic route */}
                                                <Route path="/dropouts" element={<Dropouts />} />
                                                <Route path="/request-form" element={<RequestForm />} />
                                                <Route path="/notifications" element={<Notifications />} />
                                                <Route path="/personal-information" element={<Information />} />
                                                <Route path="/sections" element={<SectionList />} />
                                                <Route path="*" element={<Navigate to="/" />} />
                                            </Routes>
                                        </div>
                                        <Footer isCollapsed={isCollapsed} />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1">
                                    <Routes>
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/about" element={<AboutUs />} />
                                        <Route path="/signup" element={<Signup />} />
                                        <Route path="/request-form" element={<RequestForm />} />
                                        <Route path="*" element={<Navigate to="/login" />} />
                                    </Routes>
                                </div>
                            )}
                        </div>
                    </div>
                </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
