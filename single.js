const cluster = require("cluster");
const cache = require("cluster-node-cache")(cluster);
const numCPUs = require("os").cpus().length || 1;
const port = process.env.PORT || 1337; // set the port for our app
const app = require("./helper/config")(cache);
const __ = require("./helper/globals");

app.listen(port);

console.log("single core server on " + port);

