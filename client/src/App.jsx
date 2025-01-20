import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import LandingPage from "./pages/LandingPage";
import FilterPage from "./pages/FilterPage";
import ResultsPage from "./pages/ResultsPage";

import "./styles/App.css";

const GOOGLE_CLIENT_ID = "920670602163-kot52u1ps9vbpdr67l7q9u5m59gjjqeu.apps.googleusercontent.com";

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Try to get user data when the app loads
    fetch("/api/whoami")
      .then((res) => res.json())
      .then((user) => {
        if (user._id) {
          setUser(user);
        }
      });
  }, []);

  // Protect routes that require authentication
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage setUser={setUser} />} />
          <Route
            path="/filter"
            element={
              <ProtectedRoute>
                <FilterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
