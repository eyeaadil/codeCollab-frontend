// App.tsx
import React, { useState, useEffect } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import { Dashboard } from "./components/Dashboard"
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Header from "./components/Header";
import { CodeEditor } from "./components/CodeEditor";
import { JoinRoom } from "./components/JoinRoom";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // New loading state

  useEffect(() => {
    // Check for authentication token in cookies on app load
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1];

    if (token) {
      // Here you might want to send the token to the backend to verify its validity
      // For now, we'll assume its presence means authenticated
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsLoadingAuth(false); // Auth check complete
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} isLoadingAuth={isLoadingAuth} /> {/* Pass isLoadingAuth */}
          <Routes>
            <Route path="/" element={<Index/>} />
            <Route path="/dashboard" element={<Dashboard/>} />
            <Route path="/room/:roomId" element={<CodeEditor />} />
            <Route path="/join-room" element={<JoinRoom />} />
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            <Route path="/signin" element={<SignIn setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;