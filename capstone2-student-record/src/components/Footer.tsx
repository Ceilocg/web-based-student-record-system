import React from 'react';

const Footer: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
    return (
        <footer className={`bg-gray-800 text-white text-center py-2 transition-all duration-300 ${isCollapsed ? 'pl-2' : 'pl-4'}`}>
            <p className="text-sm">&copy; {new Date().getFullYear()} Valentina B. Boncan National High School</p>
        </footer>
    );
};

export default Footer;
