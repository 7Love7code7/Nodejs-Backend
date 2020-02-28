require("dotenv");
const os = require("os"),
  rng = require("randomstring"),
  _ = require("lodash"),
  fs = require("fs"),
  path = require("path"),
  fetch = require("node-fetch"),
  util = require("util"),
  rimraf = util.promisify(require("rimraf"));
const PDFImage = require("pdf-image").PDFImage;
const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

//     oxr = require('open-exchange-rates'),
//     fx = require('money'),
//     moment = require('moment'),
//     oxrAppId = 'ee48a23e42e7454a9e786ba6b86a4594';
// /* Applying open exchange rate APP id */
// oxr.set({
//     app_id: oxrAppId
// })

const methods = {
  /* for singing email tokens */
  secret: "SomeRandomSecretForGeneratingJSONwebToken124111212122",
  randomChars: length => {
    return rng.generate(length);
  },
  baseUrl: () => {
    if (process.env.ENVIRONMENT === "Development") {
      return "https://cloudes-company-core-angular.firebaseapp.com/#!";
    } else {
      //return "https://cloudes.eu";
      return "http://localhost:3000/#!";
    }
  },
  log: data => {
    if (process.env.ENVIRONMENT === "Development") {
      return console.log(data);
    }
  },
  /* for checking required fields */
  requiredFields: (req, fields) => {
    let isMissing = fields.reduce((result, item) => {
      return result && item in req.body;
    }, true);
    return isMissing;
  },
  // /* CURRENCY CONVERTOR */
  // convertCurrency: (value, from, to, history) => {
  //     if (history !== null) { //  Date format : YYYY-MM-DD

  //         let formattedDate = moment(history).format('YYYY-MM-DD');

  //         oxr.historical(formattedDate, function () {
  //             fx.rates = oxr.rates;
  //             return {
  //                 value: Math.round(fx(value).from(from).to(to)),
  //                 currencyCode: to
  //             }
  //         });
  //     } else {
  //         oxr.latest(function () {
  //             fx.rates = oxr.rates;
  //             return {
  //                 value: Math.round(fx(value).from(from).to(to)),
  //                 currencyCode: to
  //             }
  //         });

  //     }

  // }
  currencyHelper: () => {
    const oxr = require("open-exchange-rates"),
      oxrAppId = "ee48a23e42e7454a9e786ba6b86a4594";
    /* Applying open exchange rate APP id */
    oxr.set({
      app_id: oxrAppId
    });
    let latest = util.promisify(oxr.latest);
    let historical = util.promisify(oxr.historical);
    return {
      getLatest: () => {
        return latest();
      },
      getHistorical: date => {
        return historical(date);
      }
    };
  },

  roleWeights: {
    admin: 0,
    manager: 1,
    sub_contractor: 2,
    team_leader: 3,
    roofer: 4
  },

  inputValidationError: (errorObj, res) => {
    let errors = errorObj.details.reduce((acc, x) => {
      acc.push({
        field: x.path[0],
        message: x.message
      });
      return acc;
    }, []);
    res.status(400).json({
      message: "Input validation error",
      errors
    });
  },
  /* Recursively freeze object keys */
  deepFreeze: o => {
    Object.freeze(o);
    Object.getOwnPropertyNames(o).forEach(prop => {
      if (
        o.hasOwnProperty(prop) &&
        o[prop] !== null &&
        (typeof o[prop] === "object" || typeof o[prop] === "function") &&
        !Object.isFrozen(o[prop])
      ) {
        methods.deepFreeze(o[prop]);
      }
    });

    return o;
  },
  generateImages: (url, pdfName, tempFolder, thumbnail) => {
    return new Promise(async (resolve, reject) => {
      try {
        /* Create a folder to store temp files */
        const makeDir = util.promisify(fs.mkdir),
          readFile = util.promisify(fs.readFile);
        tempDirPath = path.join(__dirname, "../Files", tempFolder);

        if (fs.existsSync(tempDirPath)) {
          /* Clear temporary dir if it exists */
          await rimraf(tempDirPath);
        }

        await makeDir(tempDirPath);

        const fileResponse = await fetch(url);
        const fileStream = fs.createWriteStream(
          path.join(tempDirPath, pdfName)
        );

        fileResponse.body.pipe(fileStream);

        fileResponse.body.on("error", err => {
          throw err;
        });

        fileStream.on("error", err => {
          throw err;
        });

        fileStream.on("finish", async () => {
          /* Image generation */
          try {
            let pdfImage = new PDFImage(path.join(tempDirPath, pdfName));
            const cloudinaryUploader = util.promisify(
              cloudinary.v2.uploader.upload
            );
            let result;
            if (thumbnail) {
              let image = await pdfImage.convertPage(0);
              result = await cloudinaryUploader(image, {
                folder: "thumbnail"
              });
            } else {
              let images;
              try {
                images = await pdfImage.convertFile();
              } catch (e) {
                console.log("errorrr", e);
              }

              result = [];
              console.log("converted!!!!!!!!!!!!!!!!");
              for (let i of images) {
                console.log("images", i);
                let response = await cloudinaryUploader(i, {
                  folder: "projectRoofPlan",
                  async: true
                });
                result.push(response.secure_url);
              }
            }

            await rimraf(tempDirPath);

            resolve(result);
          } catch (e) {
            console.log(e);
            reject(false);
          }
        });
      } catch (e) {
        console.log(e);
        reject(false);
      }
    });
  },
  sortByDate: (a, b) => {
    if (moment(a.createdAt).isSame(b.createdAt)) {
      return 0;
    } else {
      return moment(a.createdAt).isAfter(b.createdAt) ? -1 : 1;
    }
  },
  pdfToImg: (url, pages) => {
    return [...Array(pages)].reduce((acc, x, i) => {
      let pageUrl = url
        .replace(/upload/, `upload/pg_${i + 1}`)
        .replace(/pdf$/, "jpg");
      acc.push(pageUrl);
      return acc;
    }, []);
  }
};

module.exports = methods;
