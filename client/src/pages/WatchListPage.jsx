import React, { useState, useEffect } from "react";
import "../styles/ResultsPage.css"; // We'll reuse the ResultsPage styles

const WatchListPage = () => {
  const [watchList, setWatchList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 20;

  useEffect(() => {
    // Fetch the user's watch list when component mounts
    fetch("/api/watchlist")
      .then((res) => res.json())
      .then((data) => {
        setWatchList(data);
      })
      .catch((error) => console.error("Error fetching watch list:", error));
  }, []);

  // Calculate pagination values
  const totalPages = Math.ceil(watchList.length / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const currentMovies = watchList.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleRemoveFromWatchList = (movieId) => {
    fetch(`/api/watchlist/${movieId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        setWatchList((prev) => prev.filter((movie) => movie.id !== movieId));
      })
      .catch((error) => console.error("Error removing from watch list:", error));
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Your Watch List</h1>
        <p>You have {watchList.length} movies in your watch list</p>
      </div>

      {watchList.length > 0 && (
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
              <button
                className="remove-from-watchlist"
                onClick={() => handleRemoveFromWatchList(movie.id)}
                title="Remove from Watch List"
              >
                ★
              </button>
            </div>
            <div className="movie-details">
              <h3>{movie.title}</h3>
              <p className="movie-rating">★ {movie.vote_average.toFixed(1)}/10</p>
              <p className="movie-date">
                {new Date(movie.release_date).getFullYear()}
              </p>
              <p className="movie-overview">{movie.overview}</p>
            </div>
          </div>
        ))}
      </div>

      {watchList.length === 0 && (
        <div className="no-results">
          <h2>Your watch list is empty</h2>
          <p>Start adding movies to your watch list from the recommendations page!</p>
        </div>
      )}

      {watchList.length > 0 && (
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

export default WatchListPage;
