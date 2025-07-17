// pages/SignIn.tsx
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface SignInProps {
  setIsAuthenticated: (value: boolean) => void;
}

const SignIn = ({ setIsAuthenticated }: SignInProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const params = new URLSearchParams(location.search);
      const roomId = params.get('roomId'); // Extract roomId from URL
      const response = await fetch("https://codecollab-backend-1.onrender.com/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, roomId }), // Include roomId
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to sign in");
      }

      const data = await response.json();
      console.log("Login successful:", data.user);

      // Store tokens in cookies
      document.cookie = `access_token=${data.user.accessToken}; path=/; samesite=strict`;
      document.cookie = `refresh_token=${data.user.refreshToken}; path=/; samesite=strict`;

      // Set authentication state
      setIsAuthenticated(true);
      toast.success("Login successful! Redirecting...", { autoClose: 2000 });

      // Redirect to /join-room if roomId is present, else to /dashboard
      const redirectUrl = data.redirectUrl || "/dashboard";
      setTimeout(() => navigate(redirectUrl), 2000);
    } catch (err) {
      toast.error(err.message || "An error occurred!", { autoClose: 3000 });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-editor-bg flex items-center justify-center">
      <ToastContainer position="top-center" />
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-editor-accent/20 to-transparent rounded-full animate-spin-slow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-editor-secondary/20 to-transparent rounded-full animate-spin-slow"></div>
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-radial from-editor-accent/30 to-transparent rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-editor-secondary/30 to-transparent rounded-full filter blur-3xl animate-float" style={{ animationDelay: "-3s" }}></div>
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
            Welcome Back
          </h1>
          <p className="text-center text-editor-text/80">
            Please sign in to continue
          </p>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-6"
            onSubmit={handleSignIn}
          >
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
                className="w-full px-4 py-3 border border-editor-accent/20 rounded-lg bg-transparent text-editor-text focus:outline-none focus:ring-2 focus:ring-editor-accent placeholder-editor-text/60"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-editor-accent">
                🔒
              </span>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-editor-accent to-editor-secondary rounded-lg text-editor-bg font-semibold shadow-lg hover:shadow-editor-accent/50 hover:scale-105 transform transition-all duration-300"
            >
              Sign In
            </button>
          </motion.form>

          <div className="text-center">
            <p className="text-editor-text/80">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-editor-accent font-semibold hover:underline"
              >
                Sign Up
              </Link>
            </p>
            <p className="mt-2">
              <Link
                to="/forgot-password"
                className="text-editor-text/80 hover:text-editor-accent transition-all duration-200"
              >
                Forgot Password?
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;