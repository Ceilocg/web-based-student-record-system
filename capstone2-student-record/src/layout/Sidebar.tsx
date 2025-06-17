import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaUserCog, FaClipboardList, FaBook, FaUserGraduate, FaTimesCircle } from 'react-icons/fa';

interface SidebarProps {
    isCollapsed: boolean;
    role: 'Admin' | 'Adviser' | 'Faculty' | null; // Add the role prop
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, role }) => {
    const location = useLocation();

    // Define menu items with roles that are allowed to access each item
    const menuItems = [
        { path: '/', label: 'Dashboard', icon: <FaTachometerAlt className="text-blue-400" />, roles: ['Admin', 'Adviser', 'Faculty'] },
        { path: '/user-management', label: 'User Management', icon: <FaUserCog className="text-green-400" />, roles: ['Admin'] },
        { path: '/form-templates', label: 'Form Templates', icon: <FaClipboardList className="text-yellow-400" />, roles: ['Admin', 'Adviser', 'Faculty'] },
        { path: '/enrollment', label: 'Enrollment', icon: <FaUserGraduate className="text-cyan-400" />, roles: ['Admin'] },
        { path: '/grades', label: 'Grades', icon: <FaBook className="text-purple-400" />, roles: ['Admin', 'Adviser'] },
        { path: '/dropouts', label: 'Dropouts', icon: <FaTimesCircle className="text-orange-400" />, roles: ['Admin', 'Adviser'] },
    ];

    // Filter the menu items based on the user's role
    const filteredMenuItems = menuItems.filter((item) => item.roles.includes(role || ''));

    return (
        <aside
            className={`bg-gray-800 text-white h-screen shadow-lg transition-all duration-300 fixed top-0 left-0 z-50 ${isCollapsed ? 'w-16' : 'w-64'} overflow-y-auto`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hide scrollbars on Firefox and IE
        >
            <div className="p-4 border-b border-gray-700 flex flex-col items-center">
                <a href="https://ibb.co/qBFMV75" target="_blank" rel="noopener noreferrer">
                    <img
                        src="https://i.ibb.co/qBFMV75/school-logo.png" // Replace with your actual image URL
                        alt="School Logo"
                        className={`transition-all duration-300 ${isCollapsed ? 'h-10 w-10' : 'h-20 w-auto'}`}
                        style={{
                            objectFit: 'contain',
                        }}
                    />
                </a>
                {!isCollapsed && <h2 className="text-xl font-bold mt-2 text-center">{role} Dashboard</h2>}
            </div>

            <nav className="mt-6">
                <ul className="space-y-4">
                    {filteredMenuItems.map((item) => (
                        <li key={item.path} className={`transition-all duration-300 rounded-lg ${location.pathname === item.path ? 'bg-gray-700' : ''}`}>
                            <Link
                                to={item.path}
                                className={`flex items-center p-4 text-gray-300 transition duration-200 hover:bg-gray-600 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                            >
                                {item.icon}
                                {!isCollapsed && <span className="ml-3">{item.label}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
