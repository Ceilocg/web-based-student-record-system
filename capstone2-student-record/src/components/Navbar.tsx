import React, { useEffect, useState } from 'react';
import { FaBars, FaUserCircle, FaBell } from 'react-icons/fa';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';

interface NavbarProps {
    onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [userData, setUserData] = useState<{ username: string; imageUrl: string } | null>(null);
    const [notifications, setNotifications] = useState<{ id: string; message: string; lrn: string; status: string }[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    setUserData({
                        username: data.username,
                        imageUrl: data.imageUrl,
                    });
                } else {
                    console.log('No such user document!');
                }
            }
        };

        const fetchNotifications = async () => {
            const user = auth.currentUser;
            if (user) {
                const requestQuery = query(
                    collection(db, 'form_requests'),
                    where('status', '==', 'pending')
                );
        
                onSnapshot(requestQuery, async (querySnapshot) => {
                    const updatedNotifications = await Promise.all(
                        querySnapshot.docs.map(async (doc) => {
                            const data = doc.data();
                            const lrn = data.lrn;
        
                            // Check if the LRN exists in enrollmentForms
                            const enrollmentFormQuery = query(
                                collection(db, 'enrollmentForms'),
                                where('lrn', '==', lrn)
                            );
                            const enrollmentSnapshot = await getDocs(enrollmentFormQuery);
        
                            // Determine enrollment message
                            const enrollmentMessage = !enrollmentSnapshot.empty
                                ? 'This student is currently enrolled.'
                                : 'This request is not currently enrolled.';
        
                            // Create notification object
                            return {
                                id: doc.id, // Document ID
                                message: `${enrollmentMessage} Request from ${data.firstName} ${data.lastName} for ${data.depedForm}`, // Notification message
                                lrn, // Learner Reference Number
                                status: data.status, // Request status
                            };
                        })
                    );
        
                    setNotifications(updatedNotifications);
                });
            }
        };
        

        fetchUserData();
        fetchNotifications();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error: ', error);
        }
    };

    const handleRequestAction = async (id: string, action: 'accept' | 'decline', lrn?: string) => {
        try {
            if (action === 'accept') {
                if (!lrn || lrn === 'N/A') {
                    setSnackbarMessage('Cannot accept request: LRN is missing or invalid');
                    setSnackbarOpen(true);
                    return;
                }

                const requestDocRef = doc(db, 'form_requests', id);
                await updateDoc(requestDocRef, { status: 'accepted' });
                setSnackbarMessage('Request accepted');
            } else if (action === 'decline') {
                await deleteDoc(doc(db, 'form_requests', id));
                setSnackbarMessage('Request declined');
            }
            setSnackbarOpen(true);
            setNotifications(notifications.filter((notification) => notification.id !== id));
        } catch (error) {
            console.error('Error updating request: ', error);
            setSnackbarMessage('Error processing request');
            setSnackbarOpen(true);
        }
    };

    return (
        <header className="bg-gray-800 text-white flex items-center justify-between p-4 shadow-md z-50 relative">
            <button onClick={onToggleSidebar} className="text-white focus:outline-none">
                <FaBars className="text-2xl" />
            </button>
            <h1 className="text-xl font-bold md:text-2xl">Valentina B. Boncan National High School</h1>

            <div className="relative flex items-center space-x-4">
                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className="relative text-white focus:outline-none"
                    >
                        <FaBell className="text-2xl" />
                        {notifications.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs px-1">
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-50">
                            <div className="py-2 px-4 border-b border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                            </div>
                            <ul className="py-2 max-h-64 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <li className="px-4 py-2 text-gray-700">No new notifications</li>
                                ) : (
                                    notifications.map((notification) => (
                                        <li
                                            key={notification.id}
                                            className="px-4 py-2 text-sm text-gray-800 border-b border-gray-200"
                                        >
                                            <div>{notification.message}</div>
                                            <div className="text-gray-600 text-xs">
                                                <strong>LRN:</strong> {notification.lrn || 'N/A'}
                                            </div>
                                            <div className="mt-2 space-x-2">
                                                <button
                                                    className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                                                    onClick={() =>
                                                        handleRequestAction(notification.id, 'accept', notification.lrn)
                                                    }
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                                                    onClick={() => handleRequestAction(notification.id, 'decline')}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                            <div className="p-2 text-center">
                                <Link to="/notifications" className="text-blue-500 text-sm underline">
                                    View All Requests
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Avatar */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center focus:outline-none"
                    >
                        {userData ? (
                            <img
                                src={userData.imageUrl}
                                alt="User Avatar"
                                className="w-8 h-8 rounded-full mr-2"
                            />
                        ) : (
                            <FaUserCircle className="text-2xl" />
                        )}
                        <span>{userData ? userData.username : 'User'}</span>
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
                            <ul className="py-2">
                                <li>
                                    <Link
                                        to="/personal-information"
                                        className="block px-4 py-2 text-gray-800 hover:bg-gray-200 w-full text-left"
                                    >
                                        Show Profile
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="block px-4 py-2 text-gray-800 hover:bg-gray-200 w-full text-left focus:outline-none"
                                    >
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Snackbar for Action Feedback */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </header>
    );
};

export default Navbar;
