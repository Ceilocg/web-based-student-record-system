import React, { useState } from 'react';
import { auth } from '../firebaseConfig'; // Import your Firebase config
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            await createUserWithEmailAndPassword(auth, email, password); // Use Firebase Auth to register the user
            navigate('/'); // Redirect to home after successful signup
        } catch (err) {
            setError('Failed to sign up. Please try again.'); // Set error message
        }
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h2 className="text-2xl mb-4 text-white">Sign Up</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>} {/* Display error message */}
                <form onSubmit={handleSignup}>
                    <div className="mb-4">
                        <label className="block text-gray-300">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} // Update email state
                            className="w-full p-2 rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} // Update password state
                            className="w-full p-2 rounded"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-400">
                    Already have an account? <a href="/login" className="text-blue-600 hover:underline">Log in</a>
                </p>
            </div>
        </div>
    );
};

export default Signup;
