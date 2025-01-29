import React from "react";
import { Link } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import "../styles/NavBar.css";

// require("dotenv").config();

const GOOGLE_CLIENT_ID = "920670602163-kot52u1ps9vbpdr67l7q9u5m59gjjqeu.apps.googleusercontent.com";

const NavBar = ({ userId, handleLogin, handleLogout }) => {
  return (
    <nav className="navbar">
      <Link to="/filter" className="nav-brand">
        Search Movies
      </Link>
      <div className="nav-auth">
        {userId ? (
          <div className="user-profile">
            <img
              src={`https://picsum.photos/seed/${userId}/32/32`}
              alt="Profile"
              className="profile-image"
            />
            <button
              onClick={() => {
                googleLogout();
                handleLogout();
              }}
              className="logout-button"
            >
              Logout
            </button>
          </div>
        ) : (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleLogin}
              onError={(err) => {
                // Error handling without console.log
              }}
              size="medium"
              shape="circle"
            />
          </GoogleOAuthProvider>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
