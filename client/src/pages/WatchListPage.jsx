import React, { useState, useEffect } from "react";
import "../styles/ResultsPage.css"; // We'll reuse the ResultsPage styles

const WatchListPage = () => {
  const [watchList, setWatchList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 20;

  useEffect(() => {
    // Fetch the user's watch list when component mounts
    console.log("Fetching watch list...");
    fetch("/api/watchlist", {
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    })
      .then(async (res) => {
        console.log("Response status:", res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          throw new Error(`Failed to fetch watch list: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Watch list data received:", data);
        if (Array.isArray(data)) {
          console.log(`Found ${data.length} movies in watch list`);
          setWatchList(data);
        } else {
          console.error("Unexpected data format:", data);
          setWatchList([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching watch list:", error);
        setWatchList([]);
      });
  }, []);

  // Calculate pagination values
  const totalPages = Math.ceil(watchList.length / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const currentMovies = watchList.slice(startIndex, endIndex);

  console.log("Current watch list state:", {
    total: watchList.length,
    currentPage,
    startIndex,
    endIndex,
    visibleMovies: currentMovies.length
  });

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleRemoveFromWatchList = (movieId) => {
    console.log("Removing movie from watch list:", movieId);
    fetch(`/api/watchlist/remove/${movieId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          throw new Error(`Failed to remove from watch list: ${res.status}`);
        }
        return res.json();
      })
      .then((updatedList) => {
        console.log("Updated watch list received:", updatedList);
        if (Array.isArray(updatedList)) {
          setWatchList(updatedList);
        } else {
          console.error("Unexpected data format from remove:", updatedList);
        }
      })
      .catch((error) => {
        console.error("Error removing from watch list:", error);
      });
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
