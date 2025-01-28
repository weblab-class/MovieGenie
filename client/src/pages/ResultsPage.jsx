import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/ResultsPage.css";

const ResultsPage = () => {
  const location = useLocation();
  const allMovies = location.state?.movies || [];
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 20;

  // Calculate pagination values
  const totalPages = Math.ceil(allMovies.length / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const currentMovies = allMovies.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Your Movie Recommendations</h1>
        <p>Found {allMovies.length} movies matching your criteria</p>
      </div>

      {allMovies.length > 0 && (
        <div className="pagination-controls">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous Page
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next Page
          </button>
        </div>
      )}

      <div className="movies-grid">
        {currentMovies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <div className="movie-poster">
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "https://via.placeholder.com/500x750?text=No+Poster"
                }
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

      {allMovies.length === 0 && (
        <div className="no-results">
          <h2>No movies found matching your criteria</h2>
          <p>Try adjusting your filters to see more results</p>
        </div>
      )}

      {allMovies.length > 0 && (
        <div className="pagination-controls">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous Page
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next Page
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
