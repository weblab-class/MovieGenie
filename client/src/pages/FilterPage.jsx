import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/FilterPage.css";

const FilterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    language: "",
    min_imdb: "",
    genre: "",
    era: "",
    // is_popular: "",
  });

  // Generate decade options from 1950 to current year
  const generateDecadeOptions = () => {
    const currentYear = new Date().getFullYear();
    const endDecade = Math.floor(currentYear / 10) * 10;
    const decades = [];
    
    for (let decade = 1950; decade <= endDecade; decade += 10) {
      decades.push({
        id: `${decade}`,
        name: `${decade}s (${decade}-${decade + 9})`,
        start: `${decade}-01-01`,
        end: `${decade + 9}-12-31`
      });
    }
    
    return decades;
  };

  const filterOptions = {
    language: [
      { id: "en", name: "English" },
      { id: "es", name: "Spanish" },
      { id: "fr", name: "French" },
      { id: "de", name: "German" },
      { id: "ja", name: "Japanese" },
      { id: "ko", name: "Korean" },
      { id: "hi", name: "Hindi" },
    ],
    min_imdb: Array.from({ length: 10 }, (_, i) => ({
      id: (i + 1).toString(),
      name: `${i + 1}.0+`,
    })),
    genre: [
      { id: "28", name: "Action" },
      { id: "12", name: "Adventure" },
      { id: "16", name: "Animation" },
      { id: "35", name: "Comedy" },
      { id: "80", name: "Crime" },
      { id: "18", name: "Drama" },
      { id: "14", name: "Fantasy" },
      { id: "27", name: "Horror" },
      { id: "10749", name: "Romance" },
      { id: "878", name: "Science Fiction" },
    ],
    era: generateDecadeOptions(),
    /* Trending filter - temporarily disabled
    is_popular: [
      { id: "true", name: "Yes" },
      { id: "false", name: "No" },
    ],
    */
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create a copy of filters for API request
      const apiFilters = { ...filters };
      
      // If era is selected, add the date range parameters
      if (filters.era) {
        const selectedEra = filterOptions.era.find(era => era.id === filters.era);
        if (selectedEra) {
          apiFilters.primary_release_date_gte = selectedEra.start;
          apiFilters.primary_release_date_lte = selectedEra.end;
        }
        delete apiFilters.era;
      }

      // Remove empty filters
      const validFilters = Object.fromEntries(
        Object.entries(apiFilters).filter(([_, value]) => value !== "")
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
      language: "Language",
      min_imdb: "Minimum IMDB Rating",
      genre: "Genre",
      era: "Movie Era",
      // is_popular: "Trending",
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
      <button className="generate-button" onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Loading..." : "Generate"}
      </button>
    </div>
  );
};

export default FilterPage;
