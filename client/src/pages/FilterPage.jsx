import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/FilterPage.css";

const FilterPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    streamingService: "",
    country: "",
    language: "",
    mpaaRating: "",
    imdbRating: "",
    genre: "",
    trending: "",
  });

  const filterOptions = {
    streamingService: ["Netflix", "HBOMax", "Apple TV", "Prime"],
    country: ["United States", "Canada", "Mexico"],
    language: ["English", "Hindi", "Spanish"],
    mpaaRating: ["G", "PG", "PG-13", "R", "NC-17"],
    imdbRating: Array.from({ length: 10 }, (_, i) => i + 1),
    genre: ["Romantic Comedy", "Science Fiction", "Drama", "Action"],
    trending: ["Yes", "No"],
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleSubmit = () => {
    // Convert filters to URL parameters
    const params = new URLSearchParams(filters);
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="filter-container">
      <h1>What vibe are you looking for?</h1>
      <div className="filters-grid">
        {Object.entries(filterOptions).map(([filterType, options]) => (
          <div key={filterType} className="filter-group">
            <label>{filterType.replace(/([A-Z])/g, " $1").toUpperCase()}</label>
            <select
              value={filters[filterType]}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
            >
              <option value="">Select {filterType}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button className="generate-button" onClick={handleSubmit}>
        Generate
      </button>
    </div>
  );
};

export default FilterPage;
