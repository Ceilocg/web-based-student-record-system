'use client'

import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { 
    getAuth, 
    onAuthStateChanged, 
    updatePassword, 
    EmailAuthProvider, 
    reauthenticateWithCredential 
} from 'firebase/auth';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserCircle2, UserCog, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { FaChalkboardTeacher } from 'react-icons/fa'; 

interface User {
  id: string;
  fullname: string;
  username: string;
  email: string;
  role: string;
  status: string;
  imageUrl: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const [activeRoleFilter, setActiveRoleFilter] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Admin');
  const [status, setStatus] = useState('Active');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [reauthPassword, setReauthPassword] = useState('');

  const [userCounts, setUserCounts] = useState({ Admin: 0, Adviser: 0, Faculty: 0 });
  const [darkMode, setDarkMode] = useState(true);

  const fetchUsers = async () => {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList: User[] = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
    setUsers(usersList);

    const counts = usersList.reduce((acc: any, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, { Admin: 0, Adviser: 0, Faculty: 0 });

    setUserCounts(counts);
  };

  const fetchUserRole = async (userId: string) => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      setCurrentUserRole(userData.role);
    }
  };

  useEffect(() => {
    fetchUsers();
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserRole(user.uid);
      } else {
        setCurrentUserRole(null);
      }
    });
  }, []);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFullname(user.fullname);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
    setStatus(user.status);
    setImageFile(null);
    setReauthPassword('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const userDocRef = doc(db, 'users', editingUser.id);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    let newImageUrl = editingUser.imageUrl;

    try {
        if (currentUser && reauthPassword) {
            const credential = EmailAuthProvider.credential(currentUser.email || '', reauthPassword);
            await reauthenticateWithCredential(currentUser, credential);
        }

        if (imageFile) {
            const storageRef = ref(storage, `userImages/${editingUser.id}`);
            await uploadBytes(storageRef, imageFile);
            newImageUrl = await getDownloadURL(storageRef);
        }

        await updateDoc(userDocRef, {
            fullname,
            username,
            role,
            status,
            imageUrl: newImageUrl,
        });

        if (password && currentUser) {
            await updatePassword(currentUser, password);
        }

        resetFormState();
        await fetchUsers();

    } catch (error: any) {
        console.error("Error updating user:", error);
        alert("An error occurred while saving. Please check your input and try again.");
    }
  };

  const resetFormState = () => {
    setEditingUser(null);
    setFullname('');
    setUsername('');
    setPassword('');
    setRole('Admin');
    setStatus('Active');
    setImageFile(null);
    setReauthPassword('');
  };

  const handleCancelEdit = () => {
    resetFormState();
  };

  const filteredUsers = users.filter((user) => {
    const matchesQuery = user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = activeRoleFilter ? user.role === activeRoleFilter : true;
    return matchesQuery && matchesRole;
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} p-4 sm:p-6`}>
      <button
        onClick={toggleDarkMode}
        className={`fixed top-4 right-4 p-2 rounded-full ${
          darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-900'
        } shadow-lg`}
      >
        {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </button>

      <h2 className="text-2xl font-bold text-center mb-6">User Management</h2>

      {/* Edit User Form */}
      {editingUser && (
        <form onSubmit={handleSaveEdit} className={`mt-4 p-4 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'} rounded-lg shadow-md`}>
          <h3 className="text-xl font-bold mb-4">Edit User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Fullname"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className={`p-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-900'} border rounded-md`}
              required
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`p-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-900'} border rounded-md`}
              required
            />
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password (leave blank to keep current)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-900'} border rounded-md`}
              />
              <button
                type="button"
                className={`absolute inset-y-0 right-3 flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <input
              type="password"
              placeholder="Current Password (for verification)"
              value={reauthPassword}
              onChange={(e) => setReauthPassword(e.target.value)}
              className={`w-full p-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-900'} border rounded-md`}
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`p-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-900'} border rounded-md`}
              required
            >
              <option value="Admin">Admin</option>
              <option value="Adviser">Adviser</option>
              <option value="Faculty">Faculty</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`p-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-900'} border rounded-md`}
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {/* Image Upload with Preview */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className={`p-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-100 border-gray-300 text-gray-900'} border rounded-md`}
              />
              {imageFile && (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="New Profile Preview"
                  className="mt-2 h-16 w-16 rounded-full border border-gray-600"
                />
              )}
            </div>
          </div>

          {/* Save and Cancel Buttons */}
          <div className="mt-4 flex justify-between">
            <button type="submit" className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white p-2 rounded-md transition duration-300`}>
              Save
            </button>
            <button type="button" onClick={handleCancelEdit} className={`${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white p-2 rounded-md transition duration-300`}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Role Filter Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        <button 
          onClick={() => setActiveRoleFilter(activeRoleFilter === 'Admin' ? null : 'Admin')} 
          className={`p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg shadow-md flex items-center focus:outline-none transform hover:scale-105 transition-transform ${activeRoleFilter === 'Admin' ? (darkMode ? 'bg-blue-900' : 'bg-blue-100') : (darkMode ? 'bg-gray-800' : 'bg-white')}`}
        >
          <UserCircle2 className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-4`} />
          <div>
            <h3 className={`font-bold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Admin(s)</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{userCounts.Admin}</p>
          </div>
        </button>
        <button 
          onClick={() => setActiveRoleFilter(activeRoleFilter === 'Adviser' ? null : 'Adviser')} 
          className={`p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg shadow-md flex items-center focus:outline-none transform hover:scale-105 transition-transform ${activeRoleFilter === 'Adviser' ? (darkMode ? 'bg-green-900' : 'bg-green-100') : (darkMode ? 'bg-gray-800' : 'bg-white')}`}
        >
          <FaChalkboardTeacher className={`h-8 w-8 ${darkMode ? 'text-green-400' : 'text-green-600'} mr-4`} />
          <div>
            <h3 className={`font-bold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Adviser(s)</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{userCounts.Adviser}</p>
          </div>
        </button>
        <button 
          onClick={() => setActiveRoleFilter(activeRoleFilter === 'Faculty' ? null : 'Faculty')} 
          className={`p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg shadow-md flex items-center focus:outline-none transform hover:scale-105 transition-transform ${activeRoleFilter === 'Faculty' ? (darkMode ? 'bg-yellow-900' : 'bg-yellow-100') : (darkMode ? 'bg-gray-800' : 'bg-white')}`}
        >
          <UserCog className={`h-8 w-8 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mr-4`} />
          <div>
            <h3 className={`font-bold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Faculty(ies)</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{userCounts.Faculty}</p>
          </div>
        </button>
      </div>

      {/* Add User Button and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 space-y-4 sm:space-y-0">
        {/* Add User Button */}
        <div>
          {currentUserRole === 'Admin' && (
            <Link
              to="/add-user"
              className={`${darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} p-2 rounded transition-colors`}
            >
              Add User
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className={`w-full sm:w-3/4 flex items-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <div className="flex items-center px-3">
            {/* Search Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1012 19.5a7.5 7.5 0 004.35-1.35z"
              />
            </svg>
          </div>

          {/* Input Field */}
          <input
            type="text"
            placeholder="Search by name, username, or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full p-2 ${darkMode ? 'bg-gray-800 text-gray-200 placeholder-gray-400' : 'bg-white text-gray-800 placeholder-gray-500'} border-none focus:outline-none`}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto mt-4">
        <table className={`min-w-full border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg overflow-hidden`}>
          <thead>
            <tr className={darkMode ? 'bg-gray-800' : 'bg-gray-200'}>
              <th className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fullname</th>
              <th className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Username</th>
              <th className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
              <th className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</th>
              <th className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
              <th className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Image</th>
              {currentUserRole === 'Admin' && <th className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                <td className={`border-b ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'} p-2`}>{user.fullname}</td>
                <td className={`border-b ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'} p-2`}>{user.username}</td>
                <td className={`border-b ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'} p-2`}>{user.email}</td>
                <td className={`border-b ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'} p-2`}>{user.role}</td>
                <td className={`border-b ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'} p-2`}>{user.status}</td>
                <td className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-2`}>
                  <img src={user.imageUrl} alt="Profile" className="h-10 w-10 rounded-full" />
                </td>
                {currentUserRole === 'Admin' && (
                  <td className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-2`}>
                    <button
                      className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;