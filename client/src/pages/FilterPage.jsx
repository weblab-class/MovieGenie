import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/FilterPage.css";
import bgMovieNight from "../assets/bg-movie-night.png";

const TypewriterText = ({ text }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 100); // Adjust speed here

      return () => clearTimeout(timer);
    }
  }, [currentIndex, text]);

  return (
    <h1>
      {displayText}
      <span className="cursor"></span>
    </h1>
  );
};

const FilterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    language: "",
    display_language: "",
    genre: "",
    era: "",
    min_imdb: "",
    rating: "",
    watch_provider: "",
    runtime: "",
    sort_by: "popularity.desc",
    safeSearch: "Yes",
    watchListOnly: "No",
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
        end: `${decade + 9}-12-31`,
      });
    }

    return decades;
  };

  // This decides the ordering of how it will be rendered to the page.
  const filterOptions = {
    watch_provider: [
      { id: "8", name: "Netflix" },
      { id: "9", name: "Prime Video" },
      { id: "337", name: "Disney+" },
      { id: "384", name: "HBO Max" },
      { id: "15", name: "Hulu" },
      { id: "2", name: "Apple TV+" },
      { id: "283", name: "Crunchyroll" },
      { id: "387", name: "Peacock" },
      { id: "257", name: "fuboTV" },
    ],
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
    language: [
      { id: "en", name: "English" },
      { id: "es", name: "Spanish" },
      { id: "fr", name: "French" },
      { id: "de", name: "German" },
      { id: "ja", name: "Japanese" },
      { id: "ko", name: "Korean" },
      { id: "hi", name: "Hindi" },
    ],
    display_language: [
      { id: "en", name: "English" },
      { id: "es", name: "Spanish" },
      { id: "fr", name: "French" },
      { id: "de", name: "German" },
      { id: "ja", name: "Japanese" },
      { id: "ko", name: "Korean" },
      { id: "hi", name: "Hindi" },
    ],
    era: generateDecadeOptions(),
    min_imdb: Array.from({ length: 10 }, (_, i) => ({
      id: (i + 1).toString(),
      name: `${i + 1}.0+`,
    })),
    rating: [
      { id: "PG", name: "PG and below" },
      { id: "PG-13", name: "PG-13 and below" },
      { id: "R", name: "R and below" },
      { id: "NC-17", name: "NC-17 and below" },
    ],
    runtime: [
      { id: "30-60", name: "30-60 minutes" },
      { id: "60-90", name: "60-90 minutes" },
      { id: "90-120", name: "90-120 minutes" },
      { id: "120+", name: "120+ minutes" },
    ],
    safeSearch: [
      { id: "Yes", name: "Yes" },
      { id: "No", name: "No" },
    ],
    watchListOnly: [
      { id: "No", name: "No" },
      { id: "Yes", name: "Yes" },
    ],
    sort_by: [
      { id: "popularity.desc", name: "Popularity" },
      { id: "release_date.desc", name: "Release Date" },
      { id: "revenue.desc", name: "Revenue" },
      { id: "original_title.asc", name: "Title" },
    ],
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

      // First, if showing watch list only, get the user's watch list
      let moviesToFilter = [];
      if (filters.watchListOnly === "Yes") {
        const watchListResponse = await fetch("/api/watchlist", {
          credentials: "include"
        });
        if (!watchListResponse.ok) {
          throw new Error("Failed to fetch watch list");
        }
        moviesToFilter = await watchListResponse.json();
      }

      // Create a copy of filters for API request
      const apiFilters = { ...filters };
      delete apiFilters.watchListOnly;  // Remove watch list filter as we've handled it

      // If era is selected, add the date range parameters
      if (filters.era) {
        const selectedEra = filterOptions.era.find((era) => era.id === filters.era);
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

      // Create a list of active filter names
      const activeFilters = Object.entries(filters)
        .filter(
          ([key, value]) =>
            value !== "" && key !== "watchListOnly" && key !== "sort_by" && key !== "safeSearch"
        )
        .map(([key, value]) => {
          const option = filterOptions[key]?.find((opt) => opt.id === value);
          return option ? option.name : value;
        });

      // If showing watch list only, filter the watch list movies based on the criteria
      if (filters.watchListOnly === "Yes") {
        // Convert watch list movies to TMDB format for consistent filtering
        const tmdbFormatMovies = moviesToFilter.map(movie => ({
          id: movie.movieId,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          overview: movie.overview
        }));

        // Apply filters to watch list movies
        let filteredResults = tmdbFormatMovies;

        // Apply era filter if selected
        if (filters.era) {
          const selectedEra = filterOptions.era.find((era) => era.id === filters.era);
          if (selectedEra) {
            filteredResults = filteredResults.filter(movie => {
              const releaseDate = new Date(movie.release_date);
              const startDate = new Date(selectedEra.start);
              const endDate = new Date(selectedEra.end);
              return releaseDate >= startDate && releaseDate <= endDate;
            });
          }
        }

        // Navigate with filtered watch list results
        navigate("/results", {
          state: {
            movies: filteredResults,
            watchListOnly: true,
            activeFilters
          }
        });
      } else {
        // Make regular TMDB API request for non-watch list filtering
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

        navigate("/results", {
          state: {
            movies: data.results,
            watchListOnly: false,
            activeFilters
          }
        });
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setError("Failed to fetch movies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilterLabel = (filterType) => {
    const labels = {
      language: "Primary Language",
      display_language: "Display Language",
      genre: "Genre",
      era: "Movie Era",
      min_imdb: "Minimum IMDB Rating",
      rating: "Certification (if available)",
      watch_provider: "Streaming Service",
      runtime: "Runtime",
      sort_by: "Sort By",
      safeSearch: "Safe Search",
      watchListOnly: "Show Watch List Only",
    };
    return labels[filterType] || filterType;
  };

  return (
    <div className="filter-container" style={{'--bg-image': `url(${bgMovieNight})`}}>
      <TypewriterText text="What vibe are you looking for?" />
      <p className="filter-subtitle">All filters are optional - customize as much as you'd like!</p>
      {error && <div className="error-message">{error}</div>}
      
      <div className="filters-sections">
        <div className="filter-section">
          <h2 className="section-heading">Primary criteria</h2>
          <div className="filters-grid">
            {['watch_provider', 'genre'].map((filterType) => (
              <div 
                key={filterType} 
                className={`filter-group filter-group-highlight`}
              >
                <label>{getFilterLabel(filterType)}</label>
                <select
                  value={filters[filterType]}
                  onChange={(e) => handleFilterChange(filterType, e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select {getFilterLabel(filterType)}</option>
                  {filterOptions[filterType].map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h2 className="section-heading">Secondary criteria</h2>
          <div className="filters-grid">
            {['language', 'display_language', 'era', 'min_imdb', 'rating', 'runtime'].map((filterType) => (
              <div 
                key={filterType} 
                className="filter-group"
              >
                <label>{getFilterLabel(filterType)}</label>
                <select
                  value={filters[filterType]}
                  onChange={(e) => handleFilterChange(filterType, e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select {getFilterLabel(filterType)}</option>
                  {filterOptions[filterType].map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h2 className="section-heading">Display</h2>
          <div className="filters-grid">
            {['safeSearch', 'watchListOnly', 'sort_by'].map((filterType) => (
              <div 
                key={filterType} 
                className="filter-group"
              >
                <label>{getFilterLabel(filterType)}</label>
                <select
                  value={filters[filterType]}
                  onChange={(e) => handleFilterChange(filterType, e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select {getFilterLabel(filterType)}</option>
                  {filterOptions[filterType].map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="generate-button" onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Loading..." : "Generate"}
      </button>
    </div>
  );
};

export default FilterPage;
