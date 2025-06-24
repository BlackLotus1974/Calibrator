// src/components/Header.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo_traced.svg';

const Header = () => {
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

      {/* Navigation Links */}
      <nav className="flex space-x-4">
        <Link 
          to="/" 
          className="text-gray-600 hover:text-gray-900"
        >
          Home
        </Link>
        {/* Add more links here */}
      </nav>
    </header>
  );
};

export default Header;
