import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import logo from "./assets/logo.png";

import LandingPage from "./pages/LandingPage";
import FilterPage from "./pages/FilterPage";
import ResultsPage from "./pages/ResultsPage";
import WatchListPage from "./pages/WatchListPage";

import "./styles/App.css";

const GOOGLE_CLIENT_ID = "920670602163-kot52u1ps9vbpdr67l7q9u5m59gjjqeu.apps.googleusercontent.com";

const App = () => {
  const [user, setUser] = useState(null);
  const location = useLocation();

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
      <div className={`app-container ${user ? 'has-navbar' : ''}`}>
        {user && (
          <nav className="navbar">
            <div className="nav-content">
              <Link to="/filter" className="nav-logo">
                <img src={logo} alt="Logo" className="logo-image" />
              </Link>
              <div className="nav-links">
                {location.pathname !== '/filter' && (
                  <Link to="/filter" className="nav-button">Filter</Link>
                )}
                <Link to="/watchlist" className="nav-button">Watch List</Link>
                <button 
                  className="nav-button"
                  onClick={() => {
                    fetch("/api/logout", { method: "POST" }).then(() => {
                      setUser(null);
                    });
                  }}
                >
                  Log Out
                </button>
              </div>
            </div>
          </nav>
        )}
        <Routes>
          <Route path="/*" element={<LandingPage setUser={setUser} />} />
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
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <WatchListPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
