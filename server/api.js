/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");
import('node-fetch').then(({ default: fetch }) => {
  global.fetch = fetch;
}).catch(err => {
  console.error('Failed to load node-fetch:', err);
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
  console.error('TMDB_API_KEY is not set in environment variables');
}
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Movie discovery endpoint
router.get("/discover", async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB API key is not configured');
    }

    console.log('Received query params:', req.query);
    
    // Get query parameters
    const {
      language,
      min_imdb,
      genre,
      primary_release_date_gte,
      primary_release_date_lte,
      // is_popular
    } = req.query;

    // Build TMDB API URL with parameters
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language: 'en-US',
      include_adult: false,
      include_video: false,
      page: 1,
    });

    // Add filters to TMDB API request
    if (genre) params.append('with_genres', genre);
    if (min_imdb) params.append('vote_average.gte', min_imdb);
    if (language) params.append('with_original_language', language);
    if (primary_release_date_gte) params.append('primary_release_date.gte', primary_release_date_gte);
    if (primary_release_date_lte) params.append('primary_release_date.lte', primary_release_date_lte);
    // Trending/popularity filter - temporarily disabled
    // if (is_popular === 'true') params.append('sort_by', 'popularity.desc');

    const tmdbUrl = `${TMDB_BASE_URL}/discover/movie?${params}`;
    console.log('TMDB API URL:', tmdbUrl);

    // Make request to TMDB API
    const response = await fetch(tmdbUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('TMDB API Error:', data);
      throw new Error(data.status_message || 'Failed to fetch movies from TMDB');
    }

    console.log('Found', data.results?.length, 'movies');
    res.json(data);
  } catch (error) {
    console.error('TMDB API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
