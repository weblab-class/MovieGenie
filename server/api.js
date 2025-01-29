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

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error("WARNING: TMDB_API_KEY environment variable is not set!");
}

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

// Get user's watch list
router.get("/watchlist", auth.ensureLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const watchList = user.watchList.map((movie) => ({
      id: movie.movieId,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview,
    }));
    res.json(watchList || []);
  } catch (error) {
    console.error("Error fetching watch list:", error);
    res.status(500).json({ error: "Failed to fetch watch list" });
  }
});

// Add movie to watch list
router.post("/watchlist/add", auth.ensureLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if required fields are present
    if (!req.body.movieId || !req.body.title) {
      return res
        .status(400)
        .json({ error: "Missing required fields: movieId and title are required" });
    }

    // Convert movieId to Number if it's a string
    const movieId = Number(req.body.movieId);

    // Check if movie already exists in watch list
    const movieExists = user.watchList.some((movie) => movie.movieId === movieId);
    if (movieExists) {
      return res.status(400).json({ error: "Movie already in watch list" });
    }

    // Add movie to watch list
    user.watchList.push({
      movieId: movieId,
      title: req.body.title,
      poster_path: req.body.poster_path,
      vote_average: req.body.vote_average,
      release_date: req.body.release_date,
      overview: req.body.overview,
    });

    await user.save();

    // Return the watch list in the format expected by the frontend
    const watchList = user.watchList.map((movie) => ({
      id: movie.movieId,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview,
    }));
    res.json(watchList);
  } catch (error) {
    console.error("Error adding to watch list:", error);
    res.status(500).json({ error: error.message || "Failed to add to watch list" });
  }
});

// Remove movie from watch list
router.delete("/watchlist/remove/:movieId", auth.ensureLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const movieId = parseInt(req.params.movieId);

    // Remove movie from watch list
    user.watchList = user.watchList.filter((movie) => movie.movieId !== movieId);
    await user.save();

    // Return the updated watch list in the format expected by the frontend
    const watchList = user.watchList.map((movie) => ({
      id: movie.movieId,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview,
    }));
    res.json(watchList);
  } catch (error) {
    console.error("Error removing from watch list:", error);
    res.status(500).json({ error: "Failed to remove from watch list" });
  }
});

// TMDB API configuration
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
router.post("/movies/discover", auth.ensureLoggedIn, async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      return res
        .status(500)
        .json({ error: "Movie API configuration error. Please contact support." });
    }

    const filters = req.body;
    const TMDB_BASE_URL = "https://api.themoviedb.org/3";
    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&include_adult=false`;

    // Add filters to URL
    if (filters.language) {
      url += `&with_original_language=${filters.language}`;
    }
    if (filters.display_language) {
      url += `&language=${filters.display_language}`;
    }
    if (filters.genre) {
      url += `&with_genres=${filters.genre}`;
    }
    if (filters.watch_provider) {
      url += `&with_watch_providers=${filters.watch_provider}`;
      url += "&watch_region=US";
    }
    if (filters.primary_release_date_gte) {
      url += `&primary_release_date.gte=${filters.primary_release_date_gte}`;
    }
    if (filters.primary_release_date_lte) {
      url += `&primary_release_date.lte=${filters.primary_release_date_lte}`;
    }
    if (filters.min_imdb) {
      url += `&vote_average.gte=${filters.min_imdb}`;
    }
    if (filters.runtime) {
      const [minRuntime, maxRuntime] = filters.runtime.split("-").map(Number);
      if (maxRuntime) {
        url += `&with_runtime.gte=${minRuntime}&with_runtime.lte=${maxRuntime}`;
      } else {
        url += `&with_runtime.gte=${minRuntime}`;
      }
    }
    if (filters.sort_by) {
      url += `&sort_by=${filters.sort_by}`;
    }

    // Fetch first page to get total pages
    const firstPageResponse = await fetch(url);
    if (!firstPageResponse.ok) {
      throw new Error("Failed to fetch from TMDB API");
    }
    const firstPageData = await firstPageResponse.json();
    let allResults = [...firstPageData.results];

    // Fetch up to 4 more pages (total of 100 movies)
    const totalPages = Math.min(5, firstPageData.total_pages);
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

    const additionalResults = await Promise.all(
      remainingPages.map(async (page) => {
        const pageUrl = `${url}&page=${page}`;
        const pageResponse = await fetch(pageUrl);
        if (!pageResponse.ok) return [];
        const pageData = await pageResponse.json();
        return pageData.results;
      })
    );

    // Combine all results and remove duplicates
    allResults = [...allResults, ...additionalResults.flat()];
    const uniqueMovies = Array.from(new Map(allResults.map((movie) => [movie.id, movie])).values());
    let filteredResults = uniqueMovies;

    // Apply rating filter if specified
    const rating = filters.rating;
    if (rating) {
      // Get release dates for each movie to check certification
      const moviesWithCertification = await Promise.all(
        filteredResults.map(async (movie) => {
          const releaseDatesUrl = `${TMDB_BASE_URL}/movie/${movie.id}/release_dates?api_key=${TMDB_API_KEY}`;
          const releaseDatesResponse = await fetch(releaseDatesUrl);
          if (!releaseDatesResponse.ok) {
            return null;
          }
          const releaseData = await releaseDatesResponse.json();
          const estimatedRating = estimateUSRating(releaseData);
          return { ...movie, estimatedRating };
        })
      );

      // Filter movies based on rating
      filteredResults = moviesWithCertification.filter((movie) => {
        if (!movie || !movie.estimatedRating) return false;
        const ratingOrder = ["G", "PG", "PG-13", "R", "NC-17"];
        const movieRatingIndex = ratingOrder.indexOf(movie.estimatedRating);
        const maxRatingIndex = ratingOrder.indexOf(rating);
        return movieRatingIndex !== -1 && movieRatingIndex <= maxRatingIndex;
      });
    }

    // Apply safe search filter if enabled
    if (filters.safeSearch === "Yes") {
      filteredResults = filteredResults.filter((movie) => {
        const overview = (movie.overview || "").toLowerCase();
        const title = (movie.title || "").toLowerCase();
        const badWords = [
          "sex",
          "porn",
          "erotic",
          "nudity",
          "hardcore",
          "violate",
          "rape",
          "submissive",
          "busty",
        ];
        return !badWords.some((word) => overview.includes(word) || title.includes(word));
      });
    }

    res.json(filteredResults);
  } catch (error) {
    console.error("TMDB API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).json({ msg: "API route not found" });
});

module.exports = router;
