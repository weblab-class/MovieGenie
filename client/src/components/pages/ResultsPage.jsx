import React from "react";
import { useLocation } from "react-router-dom";
import { mockMovies } from "../../mockData";
import "../../styles/ResultsPage.css";

const ResultsPage = () => {
  const location = useLocation();
  const filters = Object.fromEntries(new URLSearchParams(location.search));

  // Filter movies based on the selected filters
  const filteredMovies = mockMovies.filter(movie => {
    if (filters.genre && !movie.genres.some(g => g.name === filters.genre)) {
      return false;
    }
    if (filters.language && movie.original_language.toLowerCase() !== filters.language.toLowerCase()) {
      return false;
    }
    if (filters.imdbRating && movie.vote_average < parseFloat(filters.imdbRating)) {
      return false;
    }
    return true;
  });

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Your Movie Recommendations</h1>
      </div>
      <div className="movies-grid">
        {filteredMovies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <div className="movie-poster">
              <img
                src={movie.poster_path}
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
