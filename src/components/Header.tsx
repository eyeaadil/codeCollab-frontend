import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="w-full bg-editor-bg py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-editor-accent">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-editor-accent to-editor-secondary">
            CollabCode
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link
            to="/signin"
           className="px-4 py-2 bg-gradient-to-r from-editor-accent to-editor-secondary rounded-md text-editor-bg font-semibold shadow hover:shadow-editor-accent/50 transition-all duration-300"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-gradient-to-r from-editor-accent to-editor-secondary rounded-md text-editor-bg font-semibold shadow hover:shadow-editor-accent/50 transition-all duration-300"
          >
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
