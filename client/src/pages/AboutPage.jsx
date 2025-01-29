import React, { useState, useEffect } from "react";
import "../styles/AboutPage.css";

const AboutPage = () => {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const fullText = "About Movie Genie";

  useEffect(() => {
    if (displayText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, displayText.length + 1));
      }, 100); // Slightly faster typing speed than landing page
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [displayText]);

  return (
    <div className="about-container">
      <div className="about-content">
        <h1>{displayText}{isTyping ? "|" : ""}</h1>
        
        <section className="intro">
          <p>Ever catch yourself scrolling on Netflix?</p>
          <p>Finding the perfect movie can be overwhelming, so we built a web app that makes it easier to discover films tailored to your tastes - and your streaming service.</p>
          <p>Instead of relying on generic suggestions, our platform customizes recommendations based on your selected preferences—whether it's your favorite genres, movie eras, available streaming service, or a specific language you enjoy.</p>
        </section>

        <section className="team">
          <p>This project was created as part of Web Lab IAP 2025 by Quantum Commit, a team of MIT students passionate about building intuitive digital experiences. Our team consists of:</p>
          <ul>
            <li>Hardi Vajir (MBA '26)</li>
            <li>Kavita Dau (MBA '26)</li>
            <li>Vineet Sharma (SB '28)</li>
          </ul>
        </section>

        <section className="technical">
          <h2>How We Built It</h2>
          <p>We powered our recommendations using The Movie Database (TMDB) API, allowing users to filter and explore movies that match their interests. By combining a simple interface with robust movie data, our app provides a seamless way to find your next favorite film.</p>
        </section>

        <section className="closing">
          <p>We hope you enjoy using our movie recommender—happy watching! 🎬</p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
