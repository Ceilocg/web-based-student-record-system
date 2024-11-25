'use client'

import React, { useState } from 'react';
import { db, auth, storage } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Upload } from 'lucide-react';

export default function AddUserPage() {
  const navigate = useNavigate();
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [image, setImage] = useState<File | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      let downloadURL = '';

      if (image) {
        const storageRef = ref(storage, `users/${userId}/profile.jpg`);
        await uploadBytes(storageRef, image);
        downloadURL = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, 'users', userId), {
        fullname,
        username,
        email,
        role,
        imageUrl: downloadURL,
        status: "Active"
      });

      setFullname('');
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('Admin');
      setImage(null);

      navigate('/user-management');
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <header className="p-4 flex justify-between items-center">
        <h1 className=""></h1>
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${
            darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-900'
          } shadow-lg`}
        >
          {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          <span className="sr-only">Toggle dark mode</span>
        </button>
      </header>

      <main className="flex-grow p-4 sm:p-6 flex flex-col justify-start">
        <form onSubmit={handleAddUser} className="w-full max-w-4xl mx-auto space-y-6">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create a new user account</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="fullname" className="block text-sm font-medium">Full Name</label>
              <input
                id="fullname"
                type="text"
                placeholder="Full Name"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
                className={`w-full p-3 rounded-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={`w-full p-3 rounded-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full p-3 rounded-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full p-3 rounded-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className={`w-full p-3 rounded-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
              >
                <option value="Admin">Admin</option>
                <option value="Adviser">Adviser</option>
                <option value="Faculty">Faculty</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="image" className="block text-sm font-medium">Profile Image</label>
              <div className="flex items-center space-x-2">
                <input
                  id="image"
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <label
                  htmlFor="image"
                  className={`cursor-pointer flex items-center justify-center w-full p-3 text-sm font-medium rounded-md ${
                    darkMode
                      ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Image
                </label>
              </div>
              {image && <p className="mt-2 text-sm">{image.name}</p>}
            </div>
          </div>

          <button
            type="submit"
            className={`w-full p-3 rounded-md ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors duration-200 text-lg font-medium`}
          >
            Add User
          </button>
        </form>
      </main>
    </div>
  );
}