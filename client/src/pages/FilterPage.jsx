import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/FilterPage.css";

const FilterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    with_genres: "",
    vote_average_gte: "",
    sort_by: "",
    with_original_language: "",
  });

  const filterOptions = {
    with_genres: [
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 16, name: "Animation" },
      { id: 35, name: "Comedy" },
      { id: 80, name: "Crime" },
      { id: 18, name: "Drama" },
      { id: 14, name: "Fantasy" },
      { id: 27, name: "Horror" },
      { id: 10749, name: "Romance" },
      { id: 878, name: "Science Fiction" },
    ],
    vote_average_gte: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `${i + 1}+ Stars` })),
    sort_by: [
      { id: "popularity.desc", name: "Most Popular" },
      { id: "vote_average.desc", name: "Highest Rated" },
      { id: "release_date.desc", name: "Recently Released" },
      { id: "revenue.desc", name: "Highest Revenue" },
    ],
    with_original_language: [
      { id: "en", name: "English" },
      { id: "es", name: "Spanish" },
      { id: "fr", name: "French" },
      { id: "ja", name: "Japanese" },
      { id: "ko", name: "Korean" },
      { id: "hi", name: "Hindi" },
    ],
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setError(null); // Clear any previous errors when user changes filters
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Remove empty filters
      const validFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );

      // Make API request
      const params = new URLSearchParams(validFilters);
      const response = await fetch(`/api/discover?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch movies");
      }

      if (!data.results || data.results.length === 0) {
        setError("No movies found matching your criteria. Try adjusting your filters.");
        return;
      }

      // Navigate to results page with the movies data
      navigate("/results", { state: { movies: data.results } });
    } catch (error) {
      console.error("Error fetching movies:", error);
      setError("Failed to fetch movies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilterLabel = (filterType) => {
    const labels = {
      with_genres: "Genre",
      vote_average_gte: "Minimum Rating",
      sort_by: "Sort By",
      with_original_language: "Language",
    };
    return labels[filterType] || filterType;
  };

  return (
    <div className="filter-container">
      <h1>What vibe are you looking for?</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="filters-grid">
        {Object.entries(filterOptions).map(([filterType, options]) => (
          <div key={filterType} className="filter-group">
            <label>{getFilterLabel(filterType)}</label>
            <select
              value={filters[filterType]}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
              disabled={isLoading}
            >
              <option value="">Select {getFilterLabel(filterType)}</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button 
        className="generate-button" 
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Generate"}
      </button>
    </div>
  );
};

export default FilterPage;
