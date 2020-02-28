const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "clientLogo",
  allowedFormats: ["jpg", "png"],
  filename: function(req, file, cb) {
    cb(undefined, req.user.companyId);
  }
});
const clientLogoParser = multer({ storage: storage });

const client = require("../controllers/client.controller");
const policy = require("../helper/policy");

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes
    .route("/createClient")
    .all(policy.isManager)
    .post(client.createClient); // TODO : create client

  apiRoutes
    .route("/listAllClients")
    .all(policy.isManager)
    .get(client.listAllClients); // TODO : list all client

  apiRoutes.route("/getClientById/:id").get(client.getClientById); // TODO : Get 1 client by id

  apiRoutes
    .route("/updateClientById/:cli_id")
    .all(policy.isManager)
    .put(client.updateClientById); // TODO : update 1 client by id

  apiRoutes
    .route("/deleteClientById/:cli_id")
    .all(policy.isManager)
    .delete(client.deleteClientById);

  apiRoutes
    .route("/createBulkClient")
    .all(policy.isManager)
    .post(client.createBulkClient);

  apiRoutes
    .route("/updateClientLogo/:cli_id")
    .all(policy.isManager)
    .all(clientLogoParser.single("file"))
    .post(client.updateClientLogo); // TODO : create client logo

  apiRoutes.route("/addstaffmember/:id").put(client.addStaffMember);

  apiRoutes.route("/getAllStaffs/:cli_id").get(client.getAllStaffs);

  apiRoutes
    .route("/mobile/listAllClients")   
    .get(client.listAllClients); // TODO : list all client
};
