const meetingRoomController = require("../controllers/meetingRoom.controller");
const uid = require("uid-safe");
const multerS3 = require("multer-s3");
const multer = require("multer");
var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
var s3 = new AWS.S3();
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

const meetingRoom = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "meetingRoom",
  //allowedFormats: ["jpg", "png", "jpeg"],
  filename: function (req, file, cb) {
    console.log(req.user._id);
    cb(undefined, req.user._id + uid.sync(9));
  }
});

const meetingRoomFilesUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "3dfilesdata/meetingRoomFiles",
    // acl: 'public-read',
    key: function (req, file, cb) {
      console.log(file);
      cb(null, uid.sync(9) + "_" + file.originalname);
    }
  })
});
const meetingRoomFiles = multer({
  storage: meetingRoom
});
module.exports = (openRoutes, apiRoutes) => {
  //apiRoutes.get("/getAccessMeetingRoomToken", meetingRoomController.getAccessMeetingRoomToken);

  // apiRoutes.post("/inviteUsersToMeeting", meetingRoomController.inviteUsersToMeeting);

  apiRoutes
    .route("/newMeetingFileMessage")
    .all(meetingRoomFilesUpload.any())
    .post(meetingRoomController.newMeetingFileMessage);
  apiRoutes
    .route("/attachFiles")
    .all(meetingRoomFiles.any())
    .post(meetingRoomController.attachFiles);
  apiRoutes
    .route("/attachFiles/:meetingRoomId")
    .get(meetingRoomController.getAttachFiles);
  apiRoutes.route("/generateVideoAccessToken").get(meetingRoomController.generateVideoAccessToken);

  apiRoutes.route("/createMeetingRoom").post(meetingRoomController.createMeetingRoom);
  apiRoutes.route("/getMembers/:channelId").get(meetingRoomController.getMembers);
  apiRoutes.route("/inviteMembers").post(meetingRoomController.inviteMembers);
  apiRoutes.route("/updateGroupInfo").put(meetingRoomController.updateGroupInfo);
  apiRoutes.route("/removeGroup").post(meetingRoomController.removeGroup);
  //apiRoutes.route("/updateMembers").post(meetingRoomController.updateMembers);

  apiRoutes
    .route("/listProjectMeetingRoom/:projectId")
    .get(meetingRoomController.listProjectMeetingRoom);

  apiRoutes.route("/getMeetingRoomDetails/:id").get(meetingRoomController.getMeetingRoomDetails);
};