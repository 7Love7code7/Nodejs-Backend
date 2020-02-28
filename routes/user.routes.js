const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const uid = require("uid-safe");

cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "profilePic",
  allowedFormats: ["jpg", "png"],
  filename: function(req, file, cb) {
    cb(undefined, req.user._id);
  }
});

const avatarParser = multer({
  storage: storage
});

const user = require("../controllers/user.controller");
const authCtrl = require("../helper/auth.controller");
const policy = require("../helper/policy");

module.exports = (openRoutes, apiRoutes) => {
  openRoutes.route("/authenticate").post(authCtrl.authenticate);

  openRoutes.route("/resetPasswordAdmin").put(authCtrl.resetPassword);

  openRoutes.route("/isTokenValid").post(authCtrl.verifyEmailToken);

  openRoutes.route("/superLogin").post(authCtrl.superLogin);

  openRoutes.route("/verifyOTP").post(authCtrl.verifyOTP);

  openRoutes.route("/generateOTP").post(authCtrl.generateOTP);

  openRoutes.route("/subscribe").post(user.subscribe);

  openRoutes.route("/authenticatesubcontractor").post(authCtrl.authenticateSubcontractor);

  apiRoutes
    .route("/logout")
    .post(authCtrl.logout)
    .get(authCtrl.logout);

  apiRoutes.route("/me").get(user.me);

  apiRoutes
    .route("/toggleUserIsActiveById/:u_id")
    .all(policy.isManager)
    .get(user.toggleUserIsActiveById);

  apiRoutes
    .route("/checkMobileAndUpdate/:u_id")
    .post(user.checkMobileAndUpdate);
  //------------------------------ APIS----------------------------//

  apiRoutes
    .route("/updateProfilePic")
    .all(avatarParser.single("file"))
    .post(user.updateProfilePic);

  apiRoutes
    .route("/updateMe")
    .all(policy.isManager)
    .post(user.updateMe);

  apiRoutes
    .route("/updateMyPassword")
    .all(policy.isManager)
    .post(user.updateMyPassword);

  /**
   * List all Roofers with params as chunk and page
   * Eg. /listAllRoofers?chunk=10&page=2
   * */
  apiRoutes
    .route("/listAllRoofers")
    //.all(policy.isManager)
    .get(user.listAllRoofers);

  /**
   * List of all roofers given in as array of ids in post request
   *  Eg. of body :
   *          ["id1", "id2"......,"idn"]
   */
  apiRoutes.route("/listGivenRoofers").post(user.listGivenRoofers);

  /**
   * List all Roofers with params as chunk and page
   * Eg. /listAllManagers?chunk=10&page=2
   * */
  apiRoutes
    .route("/listAllManagers")
    //.all(policy.isManager)
    .get(user.listAllManagers);

  /**
   * Create Roofer
   * Eg. /createRoofer
   * */
  apiRoutes
    .route("/createRoofer")
    .all(policy.isManager)
    .post(user.createRoofer);

  /**
   * Create Manager
   * Eg. /createManager
   * */

  apiRoutes
    .route("/createManager").all(avatarParser.any())
    .all(policy.isAdmin)
    .post(user.createManager);

  /* 
            To reset the admin password by super admin
        */

  apiRoutes
    .route("/resetAdminPassword")
    .all(policy.isSuperAdmin)
    .post(authCtrl.resetPasswordBySuperAdmin);

  apiRoutes.route("/bookMarkProject").put(user.bookMarkProject);

  apiRoutes.route("/getBookmarks").get(user.getBookmarks);

  apiRoutes
    .route("/getCurrentCompanyMembers/:cmpId")
    .get(user.getCurrentCompanyMembers);

  openRoutes.route("/forgetPassword").post(authCtrl.forgetPassword);

  apiRoutes
  .route("/updateUser/:id").all(avatarParser.any()).put(user.updateUser);
};
