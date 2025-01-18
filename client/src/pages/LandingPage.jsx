import React from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "../styles/LandingPage.css";

const LandingPage = ({ setUser }) => {
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    });
    
    const data = await response.json();
    setUser(data);
    navigate("/filter");
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>MovieGenie</h1>
        <p>Your personal movie recommendation assistant</p>
        <div className="login-container">
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => {
              console.log("Login Failed");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
