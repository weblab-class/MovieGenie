import React from "react";
import { Link } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import "../styles/NavBar.css";

const GOOGLE_CLIENT_ID = "747257053444-h4u0rrr2i9fqid2ufoj1ij2mqn7l3v0g.apps.googleusercontent.com";

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
            <button onClick={() => {
              googleLogout();
              handleLogout();
            }} className="logout-button">
              Logout
            </button>
          </div>
        ) : (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleLogin}
              onError={(err) => console.log("Login Failed:", err)}
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
