const User = require("../models/user.model");
const Asset = require("../models/asset.model");
const Company = require("../models/company.model");
const Subscription = require("../models/subscription.model");
const jwt = require("jsonwebtoken");
const mailer = require("./sendGrid.controller");
const uid = require("uid-safe");
const mongoose = require("mongoose");
const __ = require("../helper/globals");
const auth = require("../helper/auth.controller");

const sanitize = user => {
  //remove sensitive data
  user.password = user.salt = user.created = user.updated = undefined;
  user.webToken = user.mobileToken = user.authorizationCode = undefined;
  return user;
};

module.exports = {
  me: (req, res) => {
    let me = req.user;
    return res.json(sanitize(me));
  },

  updateMyPassword: (req, res) => {
    let user = req.user;
    let oldPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;
    if (User(user).authenticate(oldPassword)) {
      let newSaltAndPass = User(user).getSaltAndPassword(newPassword);
      user.salt = newSaltAndPass.salt;
      user.password = newSaltAndPass.password;
      user.webToken = newSaltAndPass.salt;
      User.findByIdAndUpdate(user._id, user, (err, raw) => {
        return res.json(sanitize(raw));
      });
    } else {
      res.status(500).json({
        errorTag: 107,
        message: "Invalid old Password"
      });
    }
  },

  updateMe: (req, res) => {
    let user = req.user;
    let data = req.body;
    data = sanitize(data);
    if (user) {
      User.findByIdAndUpdate(
        {
          _id: req._id
        },
        data,
        (err, result) => {
          if (result) {
            return res.json({});
          }
        }
      );
    }
  },

  updateProfilePic: (req, res) => {
    if (req.file) {
      //TODO: update new url in DB
      User.findByIdAndUpdate(
        {
          _id: req.user._id
        },
        {
          $set: {
            profilePic: req.file.secure_url
          }
        },
        (err, result) => {
          return res.json(result);
        }
      );
    } else {
      return res.json({
        status: 500
      });
    }
  },

  /**
   * LISTING FUNCTIONS
   */

  listAllRoofers: (req, res) => {
    let chunk = null,
      page = null;
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }
    let search = "";
    let regex = null;
    if (req.query.search) {
      regex = new RegExp(req.query.search, "gi");
    } else {
      regex = new RegExp();
    }
    let s = (page - 1) * chunk;
    User.find({
      $or: [
        {
          firstName: regex
        },
        {
          lastName: regex
        },
        {
          displayName: regex
        },
        {
          email: regex
        },
        {
          "address1.line1": regex
        },
        {
          "address1.line2": regex
        },
        {
          "address1.line3": regex
        },
        {
          "address1.city": regex
        }
      ]
    })
      .where({
        companyId: req.user.companyId,
        isActive: true
      })
      .skip(s)
      .limit(chunk)
      .exec((err, list) => {
        if (!err) {
          User.count(
            {
              companyId: req.user.companyId
              //designation: "roofer"
            },
            (err, count) => {
              if (!err)
                return res.status(200).json({
                  total: count,
                  list: list.map(sanitize)
                });
              else
                return res.status(500).json({
                  errorTag: 100,
                  message: err.message
                });
            }
          );
        } else {
          return res.status(500).json({
            errorTag: 100,
            message: err.message
          });
        }
      });
  },

  listGivenRoofers: (req, res) => {
    if (typeof req.body.list === "undefined")
      return res.status(500).json({
        errorTag: 100,
        message: "Invalid data params, use object = { list : [1,2,3..] }"
      });
    let idList = req.body.list;
    if (Array.isArray(idList)) {
      User.find({
        _id: {
          $in: idList
        }
      })
        .select("_id displayName mobile address1 profilePic altMobile gender")
        .exec((err, list) => {
          if (!list) {
            return res.status(500).json({
              errorTag: 100,
              message: err.message
            });
          } else {
            return res.json(list);
          }
        });
    } else {
      return res.status(500).json({
        errorTag: 103,
        message: "please put an array in the json payload"
      });
    }
  },

  listAllManagers: (req, res) => {
    let chunk = null,
      page = null;
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }
    let search = "";
    let regex = null;
    if (req.query.search) {
      regex = new RegExp(req.query.search, "gi");
    } else {
      regex = new RegExp();
    }
    let s = (page - 1) * chunk;
    User.find({
      $or: [
        {
          firstName: regex
        },
        {
          lastName: regex
        },
        {
          displayName: regex
        },
        {
          email: regex
        },
        {
          "address1.line1": regex
        },
        {
          "address1.line2": regex
        },
        {
          "address1.line3": regex
        },
        {
          "address1.city": regex
        }
      ]
    })
      .where({
        companyId: req.user.companyId,
        designation: "manager"
      })
      .skip(s)
      .limit(chunk)
      .exec((err, list) => {
        User.count(
          {
            companyId: req.user.companyId,
            designation: "manager"
          },
          (err, count) => {
            return res.status(200).json({
              total: count,
              list: list.map(sanitize)
            });
          }
        );
      });
  },

  /**
   * CREATING FUNCTIONS
   */

  createRoofer: (req, res) => {
    let roofer = req.body;
    roofer.designation = "roofer";
    roofer.companyId = req.user.companyId;
    if (roofer.mobile.dialCode.indexOf("+") !== 0) {
      roofer.mobile.dialCode = `+${roofer.mobile.dialCode}`;
    }
    let reqDialCode = roofer.mobile.dialCode;
    let reqMobile = roofer.mobile.phoneNumber;
    console.log(roofer);
    User.count(
      {
        mobile: roofer.mobile
      },
      (err, present) => {
        if (present == 0) {
          console.log(roofer);
          User(roofer).save((err, roofer) => {
            console.log(err, roofer);
            if (roofer) {
              Company.findByIdAndUpdate(
                roofer.companyId,
                {
                  $push: {
                    companyRoofers: roofer._id
                  }
                },
                {
                  safe: true,
                  upsert: true,
                  new: true
                },
                async (err, result) => {
                  //send sms to roofer
                  await auth.RooferSms(reqDialCode + reqMobile, roofer.firstName);

                  //generate and sve token
                  let token = jwt.sign(
                    {
                      _id: roofer._id
                    },
                    __.secret,
                    {
                      expiresIn: "10h"
                    }
                  );
                  //mail send
                  let mailData = {
                    name: roofer.firstName + " " + roofer.lastName,
                    email: roofer.email,
                    link: `${__.baseUrl()}/set_password?token=${token}`,
                    logo: result.companyLogo
                  };
                  console.log(mailData);
                  //send mail
                  mailer.sendAppLinkToRoofer(mailData);
                  if (result) return res.status(200).json(result);
                  else
                    return res.status(500).json({
                      error: 500,
                      message: err.message
                    });
                }
              );
            } else {
              //res -> could not save data
              return res.status(500).json({
                errorTag: 100,
                message: err.message
              });
            }
          });
        } else {
          //res -> user already present
          return res.status(500).json({
            errorTag: 100,
            message: present + " user already present"
          });
        }
      }
    );
  },

  createManager: async (req, res) => {
    let manager = req.body;
    console.log("manager: ", manager);

    let middleName = "";
    let tempString = manager.displayName;
    let temp = tempString.split(" ");
    manager.firstName = temp[0];
    manager.lastName = temp[temp.length - 1];
    await temp.map(name => {
      if (name == manager.firstName || name == manager.lastName) {
        console.log("first and last");
      } else {
        middleName = middleName + " " + name;

        manager.middleName = middleName;
      }
    });
    manager.middleName = middleName;
    if (req.files && req.files.length > 0) {
      let file = req.files[0];

      file.companyId = req.user.companyId;

      let emplpic = new Asset(file);
      let AssetObj = await emplpic.save();
      manager.profilePic = AssetObj.secure_url;
    }
    manager.designation = "manager";
    manager.companyId = req.user.companyId;
    // manager.dateOfBirth=req.body.dob._d;
    // manager.dateOfJoin=req.body.doj._d;
    User.count(
      {
        mobile: manager.mobile
      },
      (err, present) => {
        if (!err) {
          User(manager).save((err, man) => {
            if (man) {
              Company.findByIdAndUpdate(
                manager.companyId,
                {
                  $push: {
                    companyManagers: man._id
                  }
                },
                {
                  safe: true,
                  upsert: true,
                  new: true
                },
                (err, result) => {
                  let token = jwt.sign(
                    {
                      _id: man._id,
                      new: true
                    },
                    __.secret,
                    {
                      expiresIn: "10h"
                    }
                  );

                  let mailData = {
                    name: man.firstName + " " + man.lastName,
                    email: man.email,
                    link: `${__.baseUrl()}/set_password?token=${token}`,
                    logo: result.companyLogo
                  };
                  //send mail
                  mailer.welcomeMail(mailData);

                  if (result) return res.status(200).json(result);
                  else
                    return res.status(500).json({
                      error: 500,
                      message: err.message
                    });
                }
              );
            } else {
              //res -> could not save data
              return res.status(500).json({
                errorTag: 100,
                message: err.message
              });
            }
          });
        } else {
          //res -> user already present
          return res.status(500).json({
            errorTag: 100,
            message: present + " user already present"
          });
        }
      }
    );
  },

  toggleUserIsActiveById: (req, res) => {
    let u_id = req.params.u_id;
    User.findById(u_id, (err, user) => {
      if (user) {
        User.findByIdAndUpdate(
          u_id,
          {
            $set: {
              isActive: !user.isActive,
              updated: Date.now()
            }
          },
          (err, newuser) => {
            return res.json(newuser);
          }
        );
      } else
        return res.json({
          message: "user not found"
        });
    });
  },

  checkMobileAndUpdate: (req, res) => {
    let rooferId = req.params.u_id;
    let mobile = req.body;
    User.findOne({
      "mobile.dialCode": mobile.dialCode,
      "mobile.phoneNumber": mobile.phoneNumber
    }).exec((err, user) => {
      if (user) {
        return res.status(403).json({
          error: true,
          errorTag: 107,
          message: "User with this mobile already exist"
        });
      } else {
        User.findByIdAndUpdate(
          rooferId,
          {
            mobile: mobile,
            mobileToken: uid.sync(9)
          },
          {
            new: true
          },
          (err, newUser) => {
            return res.status(200).json(sanitize(newUser));
          }
        );
      }
    });
  },

  subscribe: async (req, res) => {
    try {
      let requiredFields = ["email"];

      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      let check = await Subscription.findOne({
        email: req.body.email.trim(),
        active: true
      });

      if (check) {
        return res.status(400).json({
          message: "Email is already subscribed"
        });
      }

      let newSubscription = new Subscription({ email: req.body.email });

      await newSubscription.save();

      return res.status(200).json({
        message: "Subscribed successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  bookMarkProject: async (req, res) => {
    try {
      let requiredFields = ["added", "projectId"];

      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      let obj = req.body.added
        ? { $addToSet: { bookmarkedProjects: req.body.projectId } }
        : { $pull: { bookmarkedProjects: req.body.projectId } };

      await User.update({ _id: req.user._id }, obj);

      return res.status(200).json({
        message: "Project successfully bookmarked"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getBookmarks: async (req, res) => {
    try {
      let { bookmarkedProjects } = await User.findOne({
        _id: req.user._id
      })
        .select("bookmarkedProjects")
        .populate({
          path: "bookmarkedProjects",
          select: "projectName startDate endDate address projectStatus isServiceProject created backupFolders systemTag projectImage",
          populate: {
            path: "backupFolders.hierarchies"
          }
        })
        .lean();

      return res.status(200).json({
        message: "Bookmarks loaded successfully",
        bookmarks: bookmarkedProjects
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getCurrentCompanyMembers: async (req, res) => {
    try {
      if (!req.params.cmpId)
        return res.status(300).send({ message: "Invalid CompanyId..........", data: [] });
      let lAryListAllMembers = await User.find({
        companyId: req.params.cmpId,
        _id: {
          $nin: [req.user._id]
        },
        isActive: true
      })
        .select("-salt -password -sendBirdAccessToken -webToken")
        .lean();
      return res.status(200).json({
        message: "Company Members",
        data: lAryListAllMembers
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      let id = req.params.id;

      if (!id) {
        return res.status(400).json({
          message: " requested ID is missing"
        });
      } else {
        let middleName = "";
        let employee = req.body;
        console.log("employee", employee);
        let tempString = employee.displayName;
        let temp = tempString.split(" ");
        employee.firstName = temp[0];
        employee.lastName = temp[temp.length - 1];
        await temp.map(name => {
          if (name == employee.firstName || name == employee.lastName) {
            console.log("first and last");
          } else {
            middleName = middleName + " " + name;

            employee.middleName = middleName;
          }
        });
        employee.middleName = middleName;

        if (req.files && req.files.length > 0) {
          let file = req.files[0];

          file.companyId = req.user.companyId;

          let emplpic = new Asset(file);
          let AssetObj = await emplpic.save();
          employee.profilePic = AssetObj.secure_url;
        }

        let updateduser = await User.findOneAndUpdate(
          {
            _id: id
          },
          {
            $set: employee
          },
          {
            new: true
          }
        );
        /* Save all changes */
        // await updateduser.save();

        return res.status(200).json({
          message: "user updated successfully"
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  testDb: (req, res) => {
    res.send("testing done");
  }
};
