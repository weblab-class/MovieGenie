/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");
const fetch = require("node-fetch");

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

router.post("/movies/search", (req, res) => {
  const filters = req.body;
  
  // Construct TMDB API query based on filters
  let url = 'https://api.themoviedb.org/3/discover/movie';
  
  const params = new URLSearchParams();
  
  if (filters.language) {
    params.append('language', filters.language.toLowerCase());
  }
  
  if (filters.imdbRating) {
    params.append('vote_average.gte', filters.imdbRating);
  }
  
  if (filters.genre) {
    // Map genres to TMDB genre IDs
    const genreMap = {
      "Romantic Comedy": 10749,
      "Science Fiction": 878,
      "Drama": 18,
      "Action": 28,
    };
    params.append('with_genres', genreMap[filters.genre]);
  }
  
  if (filters.trending === "Yes") {
    url = 'https://api.themoviedb.org/3/trending/movie/week';
  }

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNzJkNWI4Yjg4ZGQ0NmFjMTZjYWQ2NjQ3ZGQyNDY5ZSIsIm5iZiI6MTczNzE3MDUwMC4wODMwMDAyLCJzdWIiOiI2NzhiMWU0NDdjNzA0NzQ3MWI0MmViMGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.DVxz_3BG9YZJCNrrR9iaa2Otq9xHfNpq0J3fVFHq5D4'
    }
  };

  // Add params to URL
  const finalUrl = `${url}?${params.toString()}`;

  fetch(finalUrl, options)
    .then((response) => response.json())
    .then((data) => {
      res.json(data.results);
    })
    .catch((error) => {
      console.error("Error fetching movies:", error);
      res.status(500).json({ error: "Failed to fetch movies" });
    });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
