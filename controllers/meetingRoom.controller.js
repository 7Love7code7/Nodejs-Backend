require("dotenv");

const User = require("../models/user.model");
const Asset = require("../models/asset.model");
const MeetingRoom = require("../models/meetingRoom.model");
const entityTagController = require("./entityTag.controller");
const __ = require("../helper/globals");
const axios = require("axios");
const mime = require("mime-types");
const twilio = require("twilio");
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const ChatGrant = AccessToken.ChatGrant;
const Joi = require("joi");

function meetingRoomController() {
  /* Private vars */
  const apiToken = process.env.sendbirdApiToken,
    appId = process.env.sendbirdId,
    apiUrl = process.env.sendbirdApiUrl;
  /* controller methods */

  const methods = {
    // getAccessMeetingRoomToken: async (req, res) => {
    //   try {
    //     /* Query the user instead of getting access token through jwt since it might contain outdated key */
    //     let {
    //       sendBirdAccessToken
    //     } = await User.findOne({
    //       _id: req.user._id
    //     }).lean();

    //     if (!sendBirdAccessToken) {
    //       sendBirdAccessToken = await methods.generateAccessToken(req.user);
    //       /* update user with new token */
    //       await User.update({
    //         _id: req.user._id
    //       }, {
    //         $set: {
    //           sendBirdAccessToken
    //         }
    //       });
    //     }

    //     return res.status(200).json({
    //       message: "Access token",
    //       accessToken: sendBirdAccessToken
    //     });
    //   } catch (e) {
    //     console.log(e);
    //     return res.status(500).json({
    //       message: "Internal server error"
    //     });
    //   }
    // },

    // inviteUsersToMeeting: async (req, res) => {
    //   try {
    //     let requiredFields = ["users"];

    //     /* Validate request */
    //     if (!__.requiredFields(req, requiredFields)) {
    //       return res.status(400).json({
    //         message: "Required fields missing"
    //       });
    //     }
    //     let invitees = await User.find({
    //       _id: {
    //         $in: req.body.users
    //       }
    //     }).lean();

    //     if (invitees.length) {
    //       for (let i of invitees) {
    //         if (!i.sendBirdAccessToken) {
    //           let accessToken = await methods.generateAccessToken(i);
    //           await User.update({
    //             _id: i._id
    //           }, {
    //             $set: {
    //               sendBirdAccessToken: accessToken
    //             }
    //           });
    //         }
    //       }
    //     }

    //     return res.status(200).json({
    //       message: "AccessTokens generated"
    //     });
    //   } catch (e) {
    //     console.log(e);
    //     return res.status(500).json({
    //       message: "Internal server error"
    //     });
    //   }
    // },
    // generateAccessToken: user => {
    //   return new Promise((resolve, reject) => {
    //     axios({
    //         method: "post",
    //         url: apiUrl + "/v3/users",
    //         data: {
    //           user_id: user._id,
    //           nickname: user.displayName || "",
    //           profile_url: user.profilePic || "",
    //           issue_access_token: true
    //         },
    //         headers: {
    //           "Api-Token": apiToken
    //         }
    //       })
    //       .then(resp => {
    //         resolve(resp.data.access_token);
    //       })
    //       .catch(e => {
    //         reject(e);
    //       });
    //   });
    // },

    newMeetingFileMessage: async (req, res) => {
      try {
        if (req.files && req.files.length) {
          let files = req.files.map(x => {
            x.assetName = x.originalname;
            x.secure_url = x.url = x.location;
            x.bytes = x.size.toString();
            x.format = mime.extension(x.mimetype);
            x.providerData = {
              name: req.user.displayName
            };
            return x;
          });

          let fileData = await Asset.insertMany(files);

          return res.status(200).json({
            message: "Files created successfully",
            data: fileData
          });
        } else {
          return res.status(400).json({
            message: "Files cannot be empty"
          });
        }
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    attachFiles: async (req, res) => {
      try {
        if (!req.body.meetingRoomId) {
          return res.status(400).json({
            message: "Meeting Room ID is missing"
          });
        }
        if (req.files && req.files.length) {
          console.log(req.files)
          let files = req.files.map(x => {
            console.log("x", x)
            x.meetingRoomId = req.body.meetingRoomId;
            x.assetName = x.originalname;
            x.secure_url = x.secure_url;
            x.bytes = x.bytes;
            x.format = x.format;
            x.mimetype = x.mimetype;
            x.providerData = {
              name: req.user.displayName
            };
            x.assetCategory = 'meetingroom'
            return x;
          });
          console.log("files", files)
          let fileData = await Asset.insertMany(files);

          return res.status(200).json({
            message: "Files created successfully",
            data: fileData
          });
        } else {
          return res.status(400).json({
            message: "Files cannot be empty"
          });
        }
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    getAttachFiles: async (req, res) => {
      try {
        if (!req.params.meetingRoomId) {
          return res.status(400).json({
            message: "Meeting Room ID is missing"
          });
        }

        let fileData = await Asset.find({
          meetingRoomId: req.params.meetingRoomId
        });

        return res.status(200).json({
          message: "Files fetched successfully",
          data: fileData
        });


      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    deleteUser: async (req, res) => {
      //TODO: Remove a user from the meeting room
      try {} catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    removeGroup: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          meetingRoomId: Joi.string().trim().required(),
          channelId: Joi.string().trim().required(),
        });
        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error) return __.inputValidationError(error, res);


        await MeetingRoom.findOneAndUpdate({
          _id: req.params.meetingRoomId
        }, {
          $set: {
            isActive: 2
          }
        });

        let client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        await client.chat
          .services(process.env.TWILIO_SERVICE_SID)
          .channels(value.channelId)
          .remove()
          .then(channel => {
            console.log("channel", channel.sid);
          }).catch(e => {
            return res.status(400).json({
              message: "channel NOt found"
            });
          })

        return res.status(200).json({
          message: "Deleted Successfully"
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    updateGroupInfo: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          meetingRoomId: Joi.string().trim().required(),
          channelId: Joi.string().trim().required(),
          name: Joi.string().trim().required(),
          userId: Joi.array().items(Joi.string().trim()).required()
        });

        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error) return __.inputValidationError(error, res);
        let client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        await Promise.all(value.userId.map(async x => {
          await client.chat
            .services(process.env.TWILIO_SERVICE_SID)
            .channels(value.channelId)
            .members(x).remove()
            .then(member => {
              console.log("memberid", member.sid);
            }).catch(e => {
              return res.status(400).json({
                message: "Member NOt found",
                // data: newMeetingRoom
              });
            })


        }));


        await MeetingRoom.update({
          _id: value.meetingRoomId
        }, {
          $pull: {
            users: value.userId
          },
          $set: {
            name: value.name
          }
        });

        return res.status(200).json({
          message: "Updated successfully",
          // data: newMeetingRoom
        });

      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    /**
     * TWILIO SDK INTEGRATION
     *
     */

    getVideoAccessToken: id => {
      //console.log("process", process.env)
      let token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET
      );

      token.identity = String(id);
      let grant = new VideoGrant();
      token.addGrant(grant);

      if (process.env.TWILIO_SERVICE_SID) {
        let chatGrant = new ChatGrant({
          serviceSid: process.env.TWILIO_SERVICE_SID
        });
        token.addGrant(chatGrant);
      }
      return token;
    },

    generateVideoAccessToken: async (req, res) => {
      try {
        let token = methods.getVideoAccessToken(req.user._id);
        return res.status(200).json({
          message: "Access token generated successfully",
          token: token.toJwt()
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: e
        });
      }
    },

    listProjectMeetingRoom: async (req, res) => {
      try {
        if (!req.params.projectId) {
          return res.status(400).json({
            message: "Project ID is missing"
          });
        }

        let meetingRoomData = await MeetingRoom.find({
            projectId: req.params.projectId,
            isActive: 1
          })
          .select("-__v")
          .sort({
            createdAt: -1
          }).lean()

        return res.status(200).json({
          message: "Meeting rooms fetched successfully",
          data: meetingRoomData
        });
      } catch (e) {
        return res.status(500).json({
          message: e
        });
      }
    },

    getMeetingRoomDetails: async (req, res) => {
      try {
        if (!req.params.id) {
          return res.status(400).json({
            message: "Project ID is missing"
          });
        }

        let meetingRoomData = await MeetingRoom.findOne({
            _id: req.params.id
          })
          .select("-__v")
          .lean();

        return res.status(200).json({
          message: "Meeting room data fetched successfully",
          data: meetingRoomData
        });
      } catch (e) {
        return res.status(500).json({
          message: e
        });
      }
    },

    addUserToMeeting: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          meetingRoomId: Joi.string().required(),
          userId: Joi.string().required()
        });

        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error) return __.inputValidationError(error, res);

        await MeetingRoom.update({
          _id: value.meetingRoomId
        }, {
          $push: {
            users: value.userId
          }
        });

        return res.status(200).json({
          message: "User added successfully"
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    // inviteMembers: async (req, res) => {
    //   try {
    //     const schema = Joi.object().keys({
    //       meetingRoomId: Joi.string().required(),
    //       channelId: Joi.string().required(),
    //       userId: Joi.array().items(Joi.string().trim()).required()
    //     });

    //     let {
    //       error,
    //       value
    //     } = Joi.validate(req.body, schema);

    //     if (error) return __.inputValidationError(error, res);

    //     let userData = await User.find({
    //       _id: {
    //         $in: value.userId
    //       }
    //     }).select("displayName");
    //     let client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    //     if (userData.length != 0) {
    //       await Promise.all(userData.map(async x => {
    //         await client.chat
    //           .services(process.env.TWILIO_SERVICE_SID)
    //           .channels(value.channelId)
    //           .members.create({
    //             identity: x._id.toString(),
    //             attributes: JSON.stringify({
    //               name: x.displayName.toString()
    //             })
    //           })
    //           .then(member => {
    //             console.log("memberid", member.sid);
    //           });
    //       }));
    //     }

    //     MeetingRoom.update({
    //       _id: value.meetingRoomId
    //     }, {
    //       $push: {
    //         users: value.userId
    //       }
    //     });
    //     return res.status(200).json({
    //       message: "Added members successfully",
    //       // data: newMeetingRoom
    //     });
    //   } catch (e) {
    //     console.log(e);
    //     return res.status(500).json({
    //       message: "Internal server error"
    //     });
    //   }
    // },

    inviteMembers: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          meetingRoomId: Joi.string().required(),
          channelId: Joi.string().required(),
          userAdded: Joi.array().items().required(),
          userRemoved: Joi.array().items().required()

        });

        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error) return __.inputValidationError(error, res);
        let userData = await User.find({
          _id: {
            $in: value.userAdded
          }
        }).select("displayName");

        let client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        if (userData.length != 0) {
          await Promise.all(userData.map(async x => {
            await client.chat
              .services(process.env.TWILIO_SERVICE_SID)
              .channels(value.channelId)
              .members.create({
                identity: x._id.toString(),
                attributes: JSON.stringify({
                  name: x.displayName.toString()
                })
              })
              .then(member => {
                console.log("memberid", member.sid);
              }).catch(e => {
                return res.status(400).json({
                  message: "Member NOt found",
                })
              })
          }));
        }

        await Promise.all(value.userRemoved.map(async x => {
          await client.chat
            .services(process.env.TWILIO_SERVICE_SID)
            .channels(value.channelId)
            .members(x).remove()
            .then(member => {
              console.log("memberid", member.sid);
            }).catch(e => {
              return res.status(400).json({
                message: "Member NOt found",
              });
            })
        }));

        let newData = await MeetingRoom.findOneAndUpdate({
          _id: value.meetingRoomId
        }, {
          $set: {
            users: value.userAdded
          }
        }, {
          new: true
        });
        console.log("newData", newData)
        return res.status(200).json({
          message: "Members updated successfully"
          // members: membersData
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    getMembers: async (req, res) => {
      try {
        console.log("channelid", req.params.channelId)
        const schema = Joi.object().keys({
          channelId: Joi.string().required()
        });

        let {
          error,
          value
        } = Joi.validate(req.params, schema);

        if (error) return __.inputValidationError(error, res);
        let client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        let membersData = await client.chat
          .services(process.env.TWILIO_SERVICE_SID)
          .channels(value.channelId).members.list({
            limit: 50
          })
          .then(members => {
            return members;
          });
        return res.status(200).json({
          message: "Members fetched successfully",
          members: membersData
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    createMeetingRoom: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          name: Joi.string(),
          title: Joi.string().allow(""),
          date: Joi.string(),
          time: Joi.string(),
          projectId: Joi.string().allow(""),
          assignedTo: Joi.array(),
          description: Joi.string()
        });
        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error) return __.inputValidationError(error, res);

        value.createdBy = req.user._id;
        value.users = [...req.body.assignedTo, req.user._id.toString()];
        value.isActive = 1;
        value.systemTag = await entityTagController.generateTag("ROOM");

        let newMeetingRoom = new MeetingRoom(value);

        newMeetingRoom = await newMeetingRoom.save();
        let client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        let roomStatus = await client.video.rooms.create({
          //recordParticipantsOnConnect: true,
          //statusCallback: "http://example.org",
          type: "group",
          uniqueName: value.systemTag
        });

        let chatStatus = await client.chat
          .services(process.env.TWILIO_SERVICE_SID)
          .channels.create({
            friendlyName: "chat",
            uniqueName: value.systemTag
          })
          .then(channel => {
            return channel.sid;
          });
        //let userArr = [...req.body.assignedTo, req.user._id.toString()];
        let userData = await User.find({
          _id: {
            $in: value.users
          }
        }).select("displayName");
        if (chatStatus && userData) {
          userData.map(async x => {
            await client.chat
              .services(process.env.TWILIO_SERVICE_SID)
              .channels(chatStatus)
              .members.create({
                identity: x._id.toString(),
                attributes: JSON.stringify({
                  name: x.displayName.toString()
                })
              })
              .then(member => {
                console.log("memberid", member.sid);
              });
          });
        }

        newMeetingRoom.videoRoomSid = roomStatus.sid;
        newMeetingRoom = await newMeetingRoom.save();

        newMeetingRoom = newMeetingRoom.toObject();

        return res.status(200).json({
          message: "Meeting room created successfully",
          data: newMeetingRoom
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    }
  };

  return Object.freeze(methods);
}

module.exports = meetingRoomController();