import React, { useEffect, useState } from 'react';
import { auth, db, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc, DocumentData } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateEmail, updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface UserData {
    fullname?: string;
    username: string;
    email?: string;
    role?: string;
    status?: string;
    imageUrl?: string;
}

const Information: React.FC = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for form fields
    const [fullname, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [reauthPassword, setReauthPassword] = useState(''); // For reauthentication

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const data = userDocSnap.data() as DocumentData;
                    setUserData({
                        fullname: data.fullname ?? 'Unknown Name',
                        username: data.username ?? 'Unknown User',
                        email: data.email ?? 'N/A',
                        role: data.role ?? 'User',
                        status: data.status ?? 'Active',
                        imageUrl: data.imageUrl ?? 'https://via.placeholder.com/200',
                    });
                    setFullName(data.fullname ?? '');
                    setUsername(data.username ?? '');
                    setEmail(data.email ?? '');
                } else {
                    console.log('No such user document!');
                }
            }
        };

        fetchUserData();
    }, []);

    const reauthenticate = async () => {
        const user = auth.currentUser;
        if (user && reauthPassword) {
            const credential = EmailAuthProvider.credential(user.email!, reauthPassword);
            try {
                await reauthenticateWithCredential(user, credential);
                console.log("Re-authentication successful.");
                return true;
            } catch (error) {
                console.error("Re-authentication failed:", error);
                setError("Reauthentication failed. Please check your password and try again.");
                return false;
            }
        } else {
            setError("Please enter your current password for reauthentication.");
            return false;
        }
    };

    const handleEditProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated.");

            // Reauthenticate before making secure changes if needed
            if (email !== user.email || password) {
                const reauthenticated = await reauthenticate();
                if (!reauthenticated) {
                    setIsLoading(false);
                    return;
                }
            }

            // Update avatar in Firebase Storage under `/userImages/{user.uid}`
            let newAvatarUrl = userData?.imageUrl;
            if (avatarFile) {
                const avatarRef = ref(storage, `/userImages/${user.uid}`);
                await uploadBytes(avatarRef, avatarFile);
                newAvatarUrl = await getDownloadURL(avatarRef);
            }

            // Update Firestore with new user details
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                fullname,
                username,
                email,
                imageUrl: newAvatarUrl,
            });

            // Update Firebase Auth profile details
            await updateProfile(user, {
                displayName: username,
                photoURL: newAvatarUrl,
            });

            // Update email if changed
            if (email !== user.email) {
                await updateEmail(user, email);
            }

            // Update password if provided
            if (password) {
                await updatePassword(user, password);
            }

            // Update local state with new user data
            setUserData({ ...userData, fullname, username, email, imageUrl: newAvatarUrl });
            setIsEditing(false);
        } catch (error) {
            setError("Error updating profile: " + (error as Error).message);
            console.error("Error updating profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setAvatarFile(event.target.files[0]);
        }
    };

    if (!userData) return <div className="flex items-center justify-center h-screen text-gray-600">Loading...</div>;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="max-w-5xl w-full p-4 md:p-10 flex flex-col md:flex-row items-center space-y-10 md:space-y-0 md:space-x-16">
                
                {/* User Avatar */}
                <div className="flex flex-col items-center">
                    <img
                        src={userData.imageUrl}
                        alt="User Avatar"
                        className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover border border-gray-300 shadow-lg"
                    />
                    {isEditing && (
                        <>
                            <button
                                className="mt-4 bg-blue-600 text-white px-4 py-1.5 rounded-full font-medium hover:bg-blue-500 transition duration-200"
                                onClick={() => document.getElementById('avatarUpload')?.click()}
                            >
                                Change Photo
                            </button>
                            <input
                                type="file"
                                id="avatarUpload"
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </>
                    )}
                </div>

                {/* Profile Information Fields */}
                <div className="flex-grow">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-8">Personal Information</h2>

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <div className="space-y-5">
                        <div className="flex items-center">
                            <label className="w-28 text-gray-500 font-medium">Full Name:</label>
                            {!isEditing ? (
                                <span className="ml-2 text-gray-800">{userData.fullname}</span>
                            ) : (
                                <input
                                    type="text"
                                    value={fullname}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="ml-2 w-full px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            )}
                        </div>
                        <div className="flex items-center">
                            <label className="w-28 text-gray-500 font-medium">Username:</label>
                            {!isEditing ? (
                                <span className="ml-2 text-gray-800">{userData.username}</span>
                            ) : (
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="ml-2 w-full px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            )}
                        </div>
                        <div className="flex items-center">
                            <label className="w-28 text-gray-500 font-medium">Email:</label>
                            <span className="ml-2 text-gray-800">{userData.email}</span>
                        </div>

                        {isEditing && (
                            <>
                                <div className="flex items-center">
                                    <label className="w-28 text-gray-500 font-medium">Password:</label>
                                    <input
                                        type="password"
                                        placeholder="New Password (optional)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="ml-2 w-full px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="w-28 text-gray-500 font-medium">Current Password:</label>
                                    <input
                                        type="password"
                                        placeholder="For reauthentication"
                                        value={reauthPassword}
                                        onChange={(e) => setReauthPassword(e.target.value)}
                                        className="ml-2 w-full px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </>
                        )}
                        <div className="flex items-center">
                            <label className="w-28 text-gray-500 font-medium">Role:</label>
                            <span className="ml-2 text-gray-800">{userData.role}</span>
                        </div>
                        <div className="flex items-center">
                            <label className="w-28 text-gray-500 font-medium">Status:</label>
                            <span className="ml-2 text-gray-800">{userData.status}</span>
                        </div>
                    </div>

                    {/* Edit Profile Buttons */}
                    <div className="mt-8 text-center md:text-left">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-gray-300 px-6 py-2 rounded-full font-semibold text-gray-700 hover:bg-gray-400 transition"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleEditProfile}
                                    className={`bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="ml-4 bg-gray-400 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-500 transition"
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Information;
