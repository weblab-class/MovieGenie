/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");
import("node-fetch")
  .then(({ default: fetch }) => {
    global.fetch = fetch;
  })
  .catch((err) => {
    console.error("Failed to load node-fetch:", err);
  });

// import models so we can interact with the database
const User = require("./models/user");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.user)
    socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error("TMDB_API_KEY is not set in environment variables");
}
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Rating mappings from different countries to US ratings
const internationalRatingMappings = {
  // UK ratings
  U: "PG",
  PG: "PG",
  "12A": "PG-13",
  12: "PG-13",
  15: "R",
  18: "NC-17",
  R18: "NC-17",

  // Australian ratings
  E: "PG",
  M: "PG-13",
  "MA15+": "R",
  "R18+": "NC-17",

  // Canadian ratings
  "14A": "PG-13",
  "18A": "R",
  R: "NC-17",

  // German ratings
  "FSK 0": "PG",
  "FSK 6": "PG",
  "FSK 12": "PG-13",
  "FSK 16": "R",
  "FSK 18": "NC-17",

  // French ratings
  U: "PG",
  10: "PG",
  12: "PG-13",
  16: "R",
  18: "NC-17",

  // Japanese ratings
  G: "PG",
  PG12: "PG-13",
  "R15+": "R",
  "R18+": "NC-17",
};

// Helper function to estimate US rating from international ratings
const estimateUSRating = (releaseData) => {
  // Get all non-US certifications
  const internationalRatings = releaseData.results
    .filter((country) => country.iso_3166_1 !== "US")
    .flatMap(
      (country) =>
        country.release_dates
          .map((date) => date.certification)
          .filter((cert) => cert && cert !== "NR")
          .map((cert) => internationalRatingMappings[cert])
          .filter((cert) => cert) // Only keep valid mappings
    );

  if (internationalRatings.length === 0) {
    return null;
  }

  // Count occurrences of each US rating
  const ratingCounts = {};
  internationalRatings.forEach((rating) => {
    ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
  });

  // Get the most common US rating
  const mostCommonRating = Object.entries(ratingCounts).sort((a, b) => b[1] - a[1])[0][0];

  return mostCommonRating;
};

// Movie discovery endpoint
router.get("/discover", async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      throw new Error("TMDB API key is not configured");
    }

    console.log("Received query params:", req.query);

    // Get query parameters
    const {
      language,
      display_language,
      min_imdb,
      genre,
      primary_release_date_gte,
      primary_release_date_lte,
      rating,
      safeSearch,
      watch_provider,
      sort_by = "popularity.desc",
      runtime,
    } = req.query;

    // Build TMDB API URL with parameters
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      include_adult: false,
      include_video: false,
      page: 1,
      status: "released",
      sort_by: sort_by,
    });

    // Add filters to TMDB API request
    if (genre) params.append("with_genres", genre);
    if (min_imdb) params.append("vote_average.gte", min_imdb);
    if (watch_provider) {
      params.append("with_watch_providers", watch_provider);
      params.append("watch_region", "US"); // Set region to US for streaming services
    }

    // Handle runtime ranges
    if (runtime) {
      if (runtime === "120+") {
        params.append("with_runtime.gte", "120");
      } else {
        const [min, max] = runtime.split("-");
        params.append("with_runtime.gte", min);
        params.append("with_runtime.lte", max);
      }
    } else {
      // Default minimum runtime to filter out very short films
      params.append("with_runtime.gte", "30");
    }

    // Handle primary language (for filtering movies)
    if (language) {
      params.append("with_original_language", language);
    }

    // Handle display language (for UI localization)
    if (display_language) {
      params.set("language", `${display_language}-${display_language.toUpperCase()}`);
    } else {
      params.set("language", "en-US"); // Default to English
    }

    if (primary_release_date_gte)
      params.append("primary_release_date.gte", primary_release_date_gte);
    if (primary_release_date_lte)
      params.append("primary_release_date.lte", primary_release_date_lte);

    // Fetch first page to get total pages
    const url = `${TMDB_BASE_URL}/discover/movie?${params}`;
    console.log("\nTMDB API Request URL:", url.replace(TMDB_API_KEY, "API_KEY_HIDDEN"));
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.status_message || "Failed to fetch movies");
    }

    // Fetch up to 5 pages (100 movies)
    const totalPages = Math.min(5, data.total_pages);
    let allResults = [...data.results];

    // Fetch remaining pages
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const additionalResults = await Promise.all(
      remainingPages.map(async (page) => {
        params.set("page", page);
        const pageUrl = `${TMDB_BASE_URL}/discover/movie?${params}`;
        console.log(`\nFetching page ${page}:`, pageUrl.replace(TMDB_API_KEY, "API_KEY_HIDDEN"));
        const pageResponse = await fetch(pageUrl);
        const pageData = await pageResponse.json();
        return pageData.results;
      })
    );

    // Combine all results
    allResults = [...allResults, ...additionalResults.flat()];

    // Remove duplicate movies by ID
    const uniqueMovies = Array.from(new Map(allResults.map((movie) => [movie.id, movie])).values());
    let filteredResults = uniqueMovies;

    // Apply safe search filter if enabled
    if (safeSearch === "Yes") {
      filteredResults = filteredResults.filter((movie) => {
        const overview = (movie.overview || "").toLowerCase();
        const badWords = ["sex", "porn", "erotic", "nudity", "hardcore", "violate", "rape"];
        return !badWords.some((word) => overview.includes(word));
      });
    }

    if (rating) {
      // Get release dates for each movie to check certification
      const moviesWithCertification = await Promise.all(
        filteredResults.map(async (movie) => {
          const releaseDatesUrl = `${TMDB_BASE_URL}/movie/${movie.id}/release_dates?api_key=${TMDB_API_KEY}`;
          const releaseResponse = await fetch(releaseDatesUrl);
          const releaseData = await releaseResponse.json();

          // Find US certification
          const usRelease = releaseData.results.find((r) => r.iso_3166_1 === "US");
          let certification = usRelease?.release_dates[0]?.certification;

          // If movie is NR or undefined, try to estimate from international ratings
          if (!certification || certification === "NR") {
            // First try international ratings
            const estimatedRating = estimateUSRating(releaseData);

            if (estimatedRating) {
              certification = estimatedRating;
            } else {
              // If no international ratings, use genre and other metadata
              if (movie.adult) {
                certification = "NC-17";
              } else {
                const matureGenres = ["27", "53", "10752"]; // Horror, Thriller, War
                const hasMaturedGenres = movie.genre_ids.some((id) =>
                  matureGenres.includes(id.toString())
                );

                if (hasMaturedGenres) {
                  certification = "R";
                } else if (movie.vote_average >= 7.5 && movie.popularity > 50) {
                  certification = "PG-13";
                } else {
                  certification = "PG"; // Default to PG if we can't determine
                }
              }
            }
          }

          // Add debug information
          console.log(
            `Movie: ${movie.title}, Final Rating: ${certification}, Original US Rating: ${
              usRelease?.release_dates[0]?.certification || "None"
            }`
          );

          return {
            ...movie,
            certification,
            estimated:
              !usRelease?.release_dates[0]?.certification ||
              usRelease.release_dates[0].certification === "NR",
          };
        })
      );

      // Filter out NR movies
      filteredResults = moviesWithCertification.filter((movie) => movie.certification !== "NR");

      // If rating filter is applied, filter by rating hierarchy
      if (rating) {
        const ratingOrder = ["PG", "PG-13", "R", "NC-17"];
        const maxRatingIndex = ratingOrder.indexOf(rating);

        if (maxRatingIndex !== -1) {
          filteredResults = filteredResults.filter((movie) => {
            const movieRatingIndex = ratingOrder.indexOf(movie.certification);
            return movieRatingIndex !== -1 && movieRatingIndex <= maxRatingIndex;
          });
        }
      }
    }

    console.log("Found", filteredResults.length, "movies");

    // Return all results
    res.json({
      results: filteredResults,
      total_results: filteredResults.length,
      total_pages: Math.ceil(filteredResults.length / 20),
    });
  } catch (error) {
    console.error("TMDB API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's watch list
router.get("/watchlist", auth.ensureLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.watchList);
  } catch (error) {
    console.error("Error getting watch list:", error);
    res.status(500).json({ error: "Failed to get watch list" });
  }
});

// Add a movie to watch list
router.post("/watchlist/add", auth.ensureLoggedIn, async (req, res) => {
  try {
    const { movieId, title, poster_path, vote_average, release_date, overview } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Convert movieId to number for consistent comparison
    const movieIdNum = Number(movieId);
    
    // Check if movie is already in watch list
    if (user.watchList.some(movie => movie.movieId === movieIdNum)) {
      return res.status(400).json({ error: "Movie already in watch list" });
    }

    user.watchList.push({
      movieId: movieIdNum,
      title,
      poster_path,
      vote_average,
      release_date,
      overview
    });

    await user.save();
    res.json(user.watchList);
  } catch (error) {
    console.error("Error adding to watch list:", error);
    res.status(500).json({ error: "Failed to add movie to watch list" });
  }
});

// Remove a movie from watch list
router.delete("/watchlist/remove/:movieId", auth.ensureLoggedIn, async (req, res) => {
  try {
    const movieIdNum = Number(req.params.movieId);
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Convert all movieIds to numbers for comparison
    user.watchList = user.watchList.filter(movie => movie.movieId !== movieIdNum);
    await user.save();
    
    res.json(user.watchList);
  } catch (error) {
    console.error("Error removing from watch list:", error);
    res.status(500).json({ error: "Failed to remove movie from watch list" });
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
