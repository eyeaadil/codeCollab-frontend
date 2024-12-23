import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

const Header = ({ isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const handleLogout = async () => {
    // Clear tokens or authentication details
    try {
      // Call the backend logout controller

      console.log("login initiated");
      const response = await fetch("http://localhost:8000/auth/logout", {
        method: "POST",
        credentials: "include", // Ensure cookies are sent with the request
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("addddddddiiiiiiiiiiiiill", response);
      // if (!response.ok) {
      //   throw new Error("Failed to log out from the server.");
      // }

      // Clear client-side authentication state
      // setIsAuthenticated(false);

      // Redirect to the home page or login page
      // navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally, show an error message to the user
    }
  };

  const toggleDropdown = () => {
    console.log("Dropdown toggled"); // Debug log outside JSX
    setIsDropdownVisible((prev) => !prev);
  };

  const closeDropdown = () => {
    console.log("Dropdown closed"); // Debug log outside JSX
    setIsDropdownVisible(false);
  };

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
          {!isAuthenticated ? (
            <>
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
            </>
          ) : (
            <div className="relative">
              {/* Profile Icon */}
              <button
                onClick={toggleDropdown}
                // onBlur={closeDropdown} // Close dropdown when clicking outside
                className="flex items-center gap-2 px-4 py-2 text-editor-bg font-semibold hover:scale-105 transition-all duration-300"
              >
                <FaUserCircle size={28} className="text-editor-accent" />
              </button>
              {/* Dropdown Menu */}
              {isDropdownVisible && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2"
                  onMouseLeave={closeDropdown} // Optional: Close when mouse leaves the dropdown
                >
                  
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-editor-text hover:bg-editor-bg hover:text-editor-accent"
                  >
                    User Profile
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-editor-text hover:bg-editor-bg hover:text-editor-accent"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
