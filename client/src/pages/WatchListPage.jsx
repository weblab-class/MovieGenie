import React, { useState, useEffect } from "react";
import "../styles/ResultsPage.css"; // We'll reuse the ResultsPage styles

const WatchListPage = () => {
  const [watchList, setWatchList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState({}); // Track loading state per movie
  const moviesPerPage = 20;

  useEffect(() => {
    // Fetch the user's watch list when component mounts
    fetchWatchList();
  }, []);

  const fetchWatchList = async () => {
    try {
      console.log("Fetching watch list...");
      const response = await fetch("/api/watchlist", {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch watch list: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Watch list data received:", data);
      if (Array.isArray(data)) {
        console.log(`Found ${data.length} movies in watch list`);
        setWatchList(data);
      } else {
        console.error("Unexpected data format:", data);
        setWatchList([]);
      }
    } catch (error) {
      console.error("Error fetching watch list:", error);
      setWatchList([]);
    }
  };

  // Calculate pagination values
  const totalPages = Math.ceil(watchList.length / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const currentMovies = watchList.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo(0, 0);
  };

  const toggleWatchList = async (movie) => {
    try {
      // Set loading state for this specific movie
      setIsLoading((prev) => ({ ...prev, [movie.id]: true }));

      // Remove from watch list
      const response = await fetch(`/api/watchlist/remove/${movie.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to remove from watch list: ${response.status}`);
      }

      const updatedList = await response.json();
      console.log("Updated watch list received:", updatedList);
      if (Array.isArray(updatedList)) {
        setWatchList(updatedList);
      } else {
        console.error("Unexpected data format from remove:", updatedList);
      }
    } catch (error) {
      console.error("Error removing from watch list:", error);
    } finally {
      // Clear loading state
      setIsLoading((prev) => ({ ...prev, [movie.id]: false }));
    }
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Your Watch List</h1>
        <p className="watch-list-count">
          You have {watchList.length} {watchList.length === 1 ? "movie" : "movies"} in your watch
          list!
        </p>
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
              <div className="movie-overlay">
                <div className="movie-description">
                  <p>{movie.overview}</p>
                </div>
              </div>
              <button
                className={`watch-list-button in-list ${isLoading[movie.id] ? "loading" : ""}`}
                onClick={() => toggleWatchList(movie)}
                disabled={isLoading[movie.id]}
                title="Remove from Watch List"
              >
                ★
              </button>
            </div>
            <div className="movie-details">
              <h3>{movie.title}</h3>
              <p className="movie-rating">★ {movie.vote_average.toFixed(1)}/10</p>
              <p className="movie-date">{new Date(movie.release_date).getFullYear()}</p>
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
