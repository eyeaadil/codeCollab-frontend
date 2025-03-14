import React, { useState } from "react";
import { useLocation } from "react-router-dom"; // Import useLocation
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SignUp = () => {
  const location = useLocation(); // Get location from useLocation

  const invitationToken = new URLSearchParams(location.search).get('token'); // Extract token from URL
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match", {
        position: "top-center", // Set to middle of the screen
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: fullName,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to sign up");
      }

      const data = await response.json();
      console.log("Sign-up successful:", data);

      // Show success toast notification
      toast.success("Registration successful! Redirecting to Sign In...", {
        position: "top-center", // Set to middle of the screen
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Navigate to sign-in page after a delay
      setTimeout(() => {
        navigate("/signin");
      }, 3000);
    } catch (err) {
      toast.error(err.message, {
        position: "top-center", // Set to middle of the screen
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-editor-bg flex items-center justify-center">
      <ToastContainer
        position="top-center" // Center position
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-editor-accent/20 to-transparent rounded-full animate-spin-slow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-editor-secondary/20 to-transparent rounded-full animate-spin-slow"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-md w-full px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="shadow-2xl rounded-2xl p-8 space-y-6"
          style={{ backgroundColor: "#343750" }}
        >
          <h1 className="text-4xl font-bold text-center text-editor-text">
            Create Account
          </h1>
          <p className="text-center text-editor-text/80">
            Join us and start coding together!
          </p>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-6"
            onSubmit={handleSignUp}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-editor-accent/20 rounded-lg bg-transparent text-editor-text focus:outline-none focus:ring-2 focus:ring-editor-accent placeholder-editor-text/60"
              />
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-editor-accent">
                👤
              </span>
            </div>

            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-editor-accent/20 rounded-lg bg-transparent text-editor-text focus:outline-none focus:ring-2 focus:ring-editor-accent placeholder-editor-text/60"
              />
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-editor-accent">
                ✉️
              </span>
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-editor-accent/20 rounded-lg bg-transparent text-editor-text focus:outline-none focus:ring-2 focus:ring-editor-accent placeholder-editor-text/60"
              />
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-editor-accent">
                🔒
              </span>
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-editor-accent/20 rounded-lg bg-transparent text-editor-text focus:outline-none focus:ring-2 focus:ring-editor-accent placeholder-editor-text/60"
              />
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-editor-accent">
                🔒
              </span>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-editor-accent to-editor-secondary rounded-lg text-editor-bg font-semibold shadow-lg hover:shadow-editor-accent/50 hover:scale-105 transform transition-all duration-300"
            >
              Sign Up
            </button>
          </motion.form>

          <div className="text-center">
            <p className="text-editor-text/80">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="text-editor-accent font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;
