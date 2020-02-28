const mediaPlanet = require("../controllers/mediaPlanet.controller");
const entityTag = require("../controllers/entityTag.controller");
const policy = require("../helper/policy");
const uid = require("uid-safe");
const async = require("async");

/* Upload config */

const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

const mediaPlanetImage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "mediaPlanets",
  filename: function(req, file, cb) {
    const originalname = file.originalname.split("."),
      extension = originalname.pop();
    originalname.push(`-${uid.sync(9)}`);
    const newName = [...originalname].join("");
    cb(undefined, newName);

    // cloudinary: cloudinary,
    // folder: 'issueFiles',
    // allowedFormats: ['jpg', 'png', 'jpeg'],
    // filename: function (req, file, cb) {
    //     console.log(file);
    //     var foo = undefined;
    //     cb(undefined, foo);
  }
});

const mediaPlanetImageParser = multer({ storage: mediaPlanetImage });

module.exports = (openRoutes, apiRoutes) => {
    apiRoutes
        .route("/getMediaPlanetsForProject/:id") // :id - projectId
        .get(mediaPlanet.getMediaPlanetsForProject);

    apiRoutes
        .route("/getMediaPlanetForId/:id") // :id = mediaPlanetId
        .get(mediaPlanet.getMediaPlanetForId);

    apiRoutes
        .route("/getAllMediaPlanet")
        .get(mediaPlanet.getAllMediaPlanet);

    apiRoutes
        .route("/saveLocalMediaPlanetImage")
        .all(mediaPlanetImageParser.any())
        .post(mediaPlanet.createMediaPlanet);

    apiRoutes
        .route("/updateMediaPlanet/:id") // :id - mediaPlanetId
        .put(mediaPlanet.updateMediaPlanet);

    apiRoutes
        .route("/deleteMediaPlanets")
        .post(mediaPlanet.deleteMediaPlanets);
};
