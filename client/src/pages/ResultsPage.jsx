import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/ResultsPage.css";

const ResultsPage = () => {
  const [movies, setMovies] = useState([]);
  const location = useLocation();
  const filters = Object.fromEntries(new URLSearchParams(location.search));

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch("/api/movies/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filters),
        });
        const data = await response.json();
        setMovies(data);
      } catch (error) {
        console.error("Error fetching movies:", error);
      }
    };

    fetchMovies();
  }, [location.search]);

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Your Movie Recommendations</h1>
      </div>
      <div className="movies-grid">
        {movies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <div className="movie-poster">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
              />
              <div className="movie-details">
                <h3>{movie.title}</h3>
                <p>Language: {movie.original_language}</p>
                <p>Rating: {movie.vote_average}/10</p>
                <p>Genre: {movie.genres.map(g => g.name).join(", ")}</p>
                <p>Release Date: {movie.release_date}</p>
              </div>
            </div>
            <h3 className="movie-title">{movie.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsPage;
