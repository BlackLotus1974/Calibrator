// src/components/Header.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo_traced.svg';

const Header = ({ user, onSignOut }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-100 shadow-md">
      {/* Logo (now wrapped in a Link) */}
      <div className="flex items-center">
        <Link to="/">
          <img
            src={logo}
            alt="Calibrator Logo"
            className="w-150 h-40"
          />
        </Link>
        {/* Optional title next to the logo */}
        <Link to="/" className="text-2xl font-bold text-gray-800 hover:text-gray-900">
          
        </Link>
      </div>

      {/* Navigation Links and User Info */}
      <nav className="flex items-center space-x-4">
        <Link 
          to="/" 
          className="text-gray-600 hover:text-gray-900"
        >
          Home
        </Link>
        <Link 
          to="/history" 
          className="text-gray-600 hover:text-gray-900"
        >
          History
        </Link>
        
        {/* User Info and Sign Out */}
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Welcome, {user.email}
            </span>
            <button
              onClick={onSignOut}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-400 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Sign Out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
