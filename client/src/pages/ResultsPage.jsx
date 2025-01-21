import React from "react";
import { useLocation } from "react-router-dom";
import "../styles/ResultsPage.css";

const ResultsPage = () => {
  const location = useLocation();
  const movies = location.state?.movies || [];

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Your Movie Recommendations</h1>
        <p>Found {movies.length} movies matching your criteria</p>
      </div>
      <div className="movies-grid">
        {movies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <div className="movie-poster">
              <img
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'}
                alt={movie.title}
              />
            </div>
            <div className="movie-details">
              <h3>{movie.title}</h3>
              <p className="movie-rating">★ {movie.vote_average.toFixed(1)}/10</p>
              <p className="movie-date">{new Date(movie.release_date).getFullYear()}</p>
              <p className="movie-overview">{movie.overview}</p>
            </div>
          </div>
        ))}
      </div>
      {movies.length === 0 && (
        <div className="no-results">
          <h2>No movies found matching your criteria</h2>
          <p>Try adjusting your filters to see more results</p>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
