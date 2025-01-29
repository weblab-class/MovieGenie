/*
|--------------------------------------------------------------------------
| server.js -- The core of your server
|--------------------------------------------------------------------------
|
| This file defines how your server starts up. Think of it as the main() of your server.
| At a high level, this file does the following things:
| - Connect to the database
| - Sets up server middleware (i.e. addons that enable things like json parsing, user login)
| - Hooks up all the backend routes specified in api.js
| - Fowards frontend routes that should be handled by the React router
| - Sets up error handling in case something goes wrong when handling a request
| - Actually starts the webserver
*/

// validator runs some basic checks to make sure you've set everything up correctly
// this is a tool provided by staff, so you don't need to worry about it

// Log the TMDB API Key (temporary for debugging)
console.log("TMDB API Key in Render:", process.env.TMDB_API_KEY);

const validator = require("./validator");
validator.checkSetup();

//allow us to use process.ENV
require("dotenv").config();

//import libraries needed for the webserver to work!
const http = require("http");
const express = require("express"); // backend framework for our node server.
const session = require("express-session"); // library that stores info about each connected user
const mongoose = require("mongoose"); // library to connect to MongoDB
const path = require("path"); // provide utilities for working with file and directory paths
const fs = require("fs"); // provide utilities for working with file system

const api = require("./api");
const auth = require("./auth");

// socket stuff
const socketManager = require("./server-socket");

// Server configuration below
// TODO change connection URL after setting up your team database
const mongoConnectionURL = process.env.MONGO_SRV;
// TODO change database name to the name you chose
const databaseName = "Cluster0";

// mongoose 7 warning
mongoose.set("strictQuery", false);

// connect to mongodb
mongoose
  .connect(mongoConnectionURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: databaseName,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(`Error connecting to MongoDB: ${err}`));

// create a new express server
const app = express();
app.use(validator.checkRoutes);

// Trust the proxy when in production (Render)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// allow us to process POST requests
app.use(express.json());

// set up a session, which will persist login data across requests
app.use(
  session({
    secret: process.env.SESSION_SECRET || "session-secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  })
);

// this checks if the user is logged in, and populates "req.user"
app.use(auth.populateCurrentUser);

// connect user-defined routes
app.use("/api", api);

// Movie API endpoints
app.post("/api/movies/search", auth.ensureLoggedIn, async (req, res) => {
  try {
    const filters = req.body;
    const TMDB_API_KEY = process.env.TMDB_API_KEY;

    // Construct TMDB API query based on filters
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}`;

    if (filters.language) {
      url += `&language=${filters.language.toLowerCase()}`;
    }

    if (filters.imdbRating) {
      url += `&vote_average.gte=${filters.imdbRating}`;
    }

    if (filters.genre) {
      // You'll need to map your genres to TMDB genre IDs
      const genreMap = {
        "Romantic Comedy": 10749,
        "Science Fiction": 878,
        Drama: 18,
        Action: 28,
      };
      url += `&with_genres=${genreMap[filters.genre]}`;
    }

    if (filters.trending === "Yes") {
      url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    res.json(data.results);
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

// load the compiled react files, which will serve /index.html and /bundle.js
const reactPath = path.resolve(__dirname, "..", "client", "dist");

// Serve static files
app.use(express.static(reactPath));

// for all other routes, render index.html and let react router handle it
app.get("*", (req, res, next) => {
  const indexPath = path.join(reactPath, "index.html");

  // Check if the file exists before sending
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error("Error: index.html not found at", indexPath);
    res.status(500).send("Error: index.html not found. Please ensure the build was successful.");
  }
});

// any server errors cause this function to run
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) {
    // 500 means Internal Server Error
    console.log("The server errored when processing a request!");
    console.log(err);
  }

  res.status(status);
  res.send({
    status: status,
    message: err.message,
  });
});

// hardcode port to 3000 for now
const port = 3000;
const server = http.Server(app);
socketManager.init(server);

server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
