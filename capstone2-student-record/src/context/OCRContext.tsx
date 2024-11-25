import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from 'firebase/auth'; // Use the Firebase User type for better typing
import { auth } from '../firebaseConfig'; // Import your Firebase auth instance

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null; // Add user of type User or null
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Firebase auth listener to handle user state
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setIsAuthenticated(!!currentUser); // Set isAuthenticated based on user presence
        });
        return unsubscribe; // Clean up the listener on component unmount
    }, []);

    const login = () => {
        // Add your Firebase authentication login method here
    };

    const logout = async () => {
        await auth.signOut(); // Use Firebase sign-out
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
