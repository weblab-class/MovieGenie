const fs = require("fs");
const net = require("net");

/**
 * Provides some basic checks to make sure you've
 * correctly set up your repository.
 *
 * You normally shouldn't need to modify this file.
 *
 * Curent checks:
 * - node_modules exists
 * - warns if visiting port 3000 while running hot reloader
 */

class NodeSetupError extends Error {}
let routeChecked = false;

// poke port 5173 to see if 'npm run dev' was possibly called
function checkHotLoader() {
  return new Promise((resolve, reject) => {
    var server = net.createServer();

    server.once("error", (err) => {
      resolve(err.code === "EADDRINUSE");
    });

    server.once("listening", () => server.close());
    server.once("close", () => resolve(false));
    server.listen(5173);
  });
}

module.exports = {
  checkSetup: () => {
    if (!fs.existsSync("./node_modules/")) {
      throw new NodeSetupError(
        "node_modules not found! This probably means you forgot to run 'npm install'"
      );
    }
  },

  checkRoutes: (req, res, next) => {
    if (!routeChecked && req.url === "/") {
      checkHotLoader().then((active) => {
        if (active) {
          // Removed console.log message
        }
      });

      routeChecked = true; // only runs once to avoid spam/overhead
    }
    next();
  },
};
