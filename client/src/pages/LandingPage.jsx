import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "../styles/LandingPage.css";
import logo from "../assets/logo.png";

const LandingPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fullText = "MovieGenie";

  useEffect(() => {
    // Check login status when component mounts
    fetch("/api/whoami")
      .then((res) => res.json())
      .then((user) => {
        if (user._id) {
          setIsLoggedIn(true);
        }
      });
  }, []);

  useEffect(() => {
    if (displayText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, displayText.length + 1));
      }, 200); // Adjust typing speed here (milliseconds)
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [displayText]);

  const handleLoginSuccess = async (credentialResponse) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: credentialResponse.credential }),
    });

    const data = await response.json();
    if (data._id) {
      setUser(data);
      setIsLoggedIn(true);
    } else {
      // Removed console.log message
    }
  };

  const handleLoginError = () => {
    // Removed console.log message
  };

  return (
    <div className="landing-container">
      <div className="content">
        <div className="landing-content">
          <div className="title-container">
            <h1 className={isTyping ? "typing" : ""}>{displayText}</h1>
          </div>
          <p>Your personal movie recommendation assistant</p>
          <div className="login-container">
            <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginError} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
