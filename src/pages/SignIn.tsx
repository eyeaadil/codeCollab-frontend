import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const SignIn = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-editor-bg flex items-center justify-center">
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
          >
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
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