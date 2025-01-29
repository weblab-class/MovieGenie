import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../styles/ResultsPage.css";

const ResultsPage = () => {
  const location = useLocation();
  const movies = location.state?.movies || [];
  const watchListOnly = location.state?.watchListOnly || false;
  const activeFilters = location.state?.activeFilters || [];
  const [currentPage, setCurrentPage] = useState(1);
  const [watchList, setWatchList] = useState(new Set());
  const [isLoading, setIsLoading] = useState({}); // Track loading state per movie
  const moviesPerPage = 20;

  useEffect(() => {
    // Fetch user's watch list when component mounts
    const fetchWatchList = async () => {
      try {
        console.log("Fetching watch list...");
        const response = await fetch("/api/watchlist", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch watch list");
        }
        const watchListMovies = await response.json();
        console.log("Watch list data:", watchListMovies);
        setWatchList(new Set(watchListMovies.map((movie) => movie.id)));
      } catch (error) {
        console.error("Error fetching watch list:", error);
        setWatchList(new Set());
      }
    };

    fetchWatchList();
  }, []);

  // Calculate pagination values
  const totalPages = Math.ceil(movies.length / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const currentMovies = movies.slice(startIndex, endIndex);

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

      const isInWatchList = watchList.has(movie.id);
      console.log("Movie in watch list?", isInWatchList, movie.id);

      if (isInWatchList) {
        // Remove from watch list
        const response = await fetch(`/api/watchlist/remove/${movie.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to remove from watch list");
        }

        const updatedList = await response.json();
        console.log("Updated list after remove:", updatedList);
        setWatchList(new Set(updatedList.map(movie => movie.id)));
      } else {
        // Add to watch list
        console.log("Adding movie to watch list:", movie);
        const response = await fetch("/api/watchlist/add", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            movieId: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            release_date: movie.release_date,
            overview: movie.overview,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error("Failed to add to watch list");
        }

        const updatedList = await response.json();
        console.log("Updated list after add:", updatedList);
        setWatchList(new Set(updatedList.map(movie => movie.id)));
      }
    } catch (error) {
      console.error("Error updating watch list:", error);
    } finally {
      // Clear loading state
      setIsLoading((prev) => ({ ...prev, [movie.id]: false }));
    }
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Your Movie Recommendations</h1>
        {activeFilters.length > 0 && (
          <p className="active-filters">Filters: {activeFilters.join(", ")}</p>
        )}
        <p>Found {movies.length} movies matching your criteria</p>
        {watchListOnly && (
          <p className="watch-list-filter">Showing movies from your watch list only</p>
        )}
        {watchList.size === 0 && (
          <p className="watch-list-hint">
            Pro tip: Click the ★ on any movie to add it to your watch list!
          </p>
        )}
      </div>

      {movies.length > 0 && (
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
                className={`watch-list-button ${watchList.has(movie.id) ? "in-list" : ""} ${
                  isLoading[movie.id] ? "loading" : ""
                }`}
                onClick={() => toggleWatchList(movie)}
                disabled={isLoading[movie.id]}
                title={watchList.has(movie.id) ? "Remove from Watch List" : "Add to Watch List"}
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

      {movies.length === 0 && (
        <div className="no-results">
          <h2>No movies found matching your criteria</h2>
          <p>Try adjusting your filters to see more results</p>
        </div>
      )}

      {movies.length > 0 && (
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
