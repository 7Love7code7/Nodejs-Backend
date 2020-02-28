"use strict";

/**
 * Desc: Authentication controller functions that compute auth task communicating with database
 */
const nodeCache = require("node-cache");
let cache = new nodeCache();
const crypto = require("crypto");
const request = require("request");
const jwt = require("jsonwebtoken");
const superSecret = "xyz";
const User = require("../models/user.model");
const Subcontratcor = require("../models/subcontractor.model");
const accountSid = "ACdfdb943e6c2ff051ed0bbb1254dd219c";
const authToken = "d303c5def7541c816ea835143fa545df";
const validPass = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})");
const mongoose = require("mongoose");
const mailer = require("../controllers/sendGrid.controller.js");
const __ = require("../helper/globals");
const $enums = require("../enums");

//require the Twilio module and create a REST client
const client = require("twilio")(accountSid, authToken);
const sanitize = user => {
  //remove sensitive data
  user.password = user.salt = user.created = user.updated = undefined;
  user.webToken = user.mobileToken = user.authorizationCode = undefined;
  console.log(user);
  return user;
};

const sendOTP = (phone, otp, cb) => {
  let msg = otp + " is your OTP code for Cloudes app login";
  client.messages.create(
    {
      to: phone,
      from: "+18559762121",
      body: msg
    },
    function(err, message) {
      cb(err, message);
    }
  );
};

const isValidEmail = email => {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    email
  );
};

const isValidPass = pass => {
  // return validPass.test(pass)
  // return /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(pass)
  return true;
};

module.exports = {
  //message to roofer

  RooferSms: (phone, name) => {
    let msg =
      "Hi " +
      name +
      ", " +
      "You have been added as CloudES member. You can use your contact number to login in the application.";

    client.messages.create(
      {
        to: phone,
        from: "+18559762121",
        body: msg
      },
      function(err, messages) {
        if (err) {
          console.log("couldn't send SMS", err);
        } else {
          console.log("SMS Sent");
        }
      }
    );
  },

  setCache: c => {
    //cache = c;
  },

  superLogin: (req, res) => {
    console.log(req.body);
    if (isValidEmail(req.body.email) && isValidPass(req.body.password)) {
      User.findOne(
        {
          email: req.body.email
        },
        (err, user) => {
          console.log("user", user);
          console.log(
            User(user).authenticate(req.body.password) &&
              User(user).isSuperAdmin()
          );
          if (
            !User(user).authenticate(req.body.password) ||
            !User(user).isSuperAdmin()
          ) {
            return res.status(401).json({
              verified: false,
              message: "Invlaid login"
            });
          } else {
            let token = jwt.sign(
              {
                _id: user._id,
                mobile: user.mobile
              },
              superSecret,
              {
                expiresIn: 60 * 60 * 24
              }
            );
            user.webToken = token;
            user.providerData = {
              lastLogin: Date.now()
            };
            User.findByIdAndUpdate(
              {
                _id: user._id
              },
              user,
              (err, user) => {
                if (err) {
                  return res.json({
                    verified: false,
                    message: "Server Error",
                    status: 500
                  });
                } else {
                  //remove sensitive data
                  user.password = user.salt = user.created = user.updated = undefined;
                  user.webToken = user.mobileToken = user.authorizationCode = undefined;
                  return res.json({
                    verified: true,
                    user: user,
                    token: token,
                    status: 200
                  });
                }
              }
            );
          }
        }
      );
    } else {
      return res.status(400).json({
        status: 403,
        message: "Invalid credential format"
      });
    }
  },

  authenticate: (req, res) => {
    if (isValidEmail(req.body.email) && isValidPass(req.body.password)) {
      User.findOne(
        {
          email: req.body.email
        },
        (err, user) => {
          console.log(User(user).isSuperAdmin());
          if (
            !User(user).authenticate(req.body.password) ||
            User(user).isSuperAdmin()
          ) {
            return res.status(400).json({
              verified: false,
              message: "Invalid login!"
            });
          } else {
            let expiry = 60 * 60 * 24;
            if (req.body.rememberme) {
              expiry *= 365;
            }
            let token = jwt.sign(
              {
                _id: user._id,
                mobile: user.mobile
              },
              superSecret,
              {
                expiresIn: expiry
              }
            );
            user.webToken = token;
            user.providerData = {
              lastLogin: Date.now()
            };
            User.findByIdAndUpdate(
              {
                _id: user._id
              },
              user,
              (err, user) => {
                if (err) {
                  return res.json({
                    verified: false,
                    message: "Server Error",
                    status: 500
                  });
                } else {
                  //remove sensitive data
                  user.password = user.salt = user.created = user.updated = undefined;
                  user.webToken = user.mobileToken = user.authorizationCode = undefined;
                  return res.json({
                    verified: true,
                    user: user,
                    token: token,
                    status: 200
                  });
                }
              }
            );
          }
        }
      );
    } else {
      return res.status(400).json({
        status: 403,
        message: "Invalid credential format"
      });
    }
  },

  logout: (req, res) => {
    return res.json({
      message: "functionality not added yet"
    });
  },

  verifyOTP: (req, res) => {
    var clientotp = req.body.otp.toString();
    var phoneNumber = req.body.mobile.phoneNumber;
    var dialCode =
      req.body.mobile.dialCode.indexOf("+") === 0
        ? req.body.mobile.dialCode
        : `+${req.body.mobile.dialCode}`;

    User.findOne(
      {
        "mobile.dialCode": dialCode,
        "mobile.phoneNumber": phoneNumber
      },
      (err, val) => {
        if (!err) {
          /* temporary otp bypass */
          if (
            req.body.mobile.phoneNumber === "9560766411" &&
            req.body.otp === "1111"
          ) {
            User.findOne({
              "mobile.phoneNumber": "9560766411"
            })
              .then(user => {
                console.log(user);
                let token = jwt.sign(
                  {
                    _id: user._id,
                    mobile: user.mobile
                  },
                  superSecret
                );

                User.findOneAndUpdate(
                  {
                    "mobile.phoneNumber": req.body.mobile.phoneNumber,
                    isActive: true
                  },
                  {
                    mobileToken: token
                  }
                )
                  .then(raw => {
                    return res.json({
                      verified: true,
                      user: sanitize(raw),
                      message: "Enjoy your token!",
                      token: token
                    });
                  })
                  .catch(e => {
                    console.log(e);
                    return res.status(500).json({
                      message: "Internal server error"
                    });
                  });
              })
              .catch(e => {
                console.log(e);
                return res.status(500).json({
                  message: "Internal server error"
                });
              });

            return;
          }
          /* end of temporary otp bypass */
          if (val) {
            if (val.verifyOtpHash(clientotp)) {
              // and store token in user as mobileToken : token
              var token = jwt.sign(
                {
                  _id: val._id,
                  mobile: req.body.mobile
                },
                superSecret
              );
              User.findOneAndUpdate(
                {
                  "mobile.dialCode": dialCode,
                  "mobile.phoneNumber": phoneNumber,
                  isActive: true
                },
                {
                  mobileToken: token
                },
                (err, raw) => {
                  return res.json({
                    verified: true,
                    user: sanitize(raw),
                    message: "Enjoy your token!",
                    token: token
                  });
                }
              );
              // return the information including token as JSON
            } else {
              //otp wrong
              return res.json({
                msg: "incorrect otp or expired",
                verified: false
              });
            }
          } else {
            return res.json({
              msg: "incorrect data",
              verified: false
            });
          }
        } else {
          //cache error
          return res.json({
            msg: "server error",
            verified: false
          });
        }
      }
    );

    cache.get(dialCode + phoneNumber, (err, val) => {});
  },

  verifyToken: (req, res, next) => {
    //This is a middleware to compute validity of token
    let token = req.headers["x-access-token"];
    let platform = {};
    if (req.headers["platform"]) platform = JSON.parse(req.headers["platform"]);
    if (token && platform.source !== undefined) {
      jwt.verify(token, superSecret, (err, decoded) => {
        if (err) {
          return res.status(401).json({
            errorTag: 103,
            message: "Token expired"
          });
        } else {
          User.findById(decoded._id, (err, user) => {
            if (user) {
              //user.mobileToken = user.webtoken = user.salt = user.password = undefined;
              req.user = user;
              next(); 
              // switch ($enums.PLATFORM[platform.source]) {
              //   case "web":
              //     console.log("Token claimed for web");
              //     if (user.webToken == token) {
              //       next(); // make sure we go to the next routes and don't stop here
              //     } else {
              //       return res.status(401).json({
              //         errorTag: 103,
              //         message: "Token expired (logged in somewhere else)"
              //       });
              //     }
              //     break;
              //   case "ios":
              //     console.log("Token claimed for mobile");
              //     if (user.mobileToken == token) {
              //       next(); // make sure we go to the next routes and don't stop here
              //     } else {
              //       return res.status(401).json({
              //         errorTag: 103,
              //         message: "Token expired (logged in somewhere else)"
              //       });
              //     }
              //     break;
              //   case "android":
              //     console.log("Token claimed for mobile");
              //     if (user.mobileToken == token) {
              //       next(); // make sure we go to the next routes and don't stop here
              //     } else {
              //       return res.status(401).json({
              //         errorTag: 103,
              //         message: "Token expired (logged in somewhere else)"
              //       });
              //     }
              //     break;
              //   default:
              //     return res.status(500).json({
              //       errorTag: 100,
              //       message: "Invalid api usage, source not defined"
              //     });
              // }
            } else
              return res.status(400).json({
                errorTag: 104,
                message: "Invalid headers"
              });
          });
        }
      });
    } else {
      // if there is no token or platform headers
      // return an HTTP response of 403 (access forbidden) and an error message
      return res.status(403).send({
        errorTag: 104,
        message: "Invalid headers"
      });
    }
  },

  generateOTP: async (req, res) => {
    let reqMobile = req.body.phoneNumber;
    let reqDialCode =
      req.body.dialCode.indexOf("+") === 0
        ? req.body.dialCode
        : `+${req.body.dialCode}`;
    reqDialCode.replace(/[^a-zA-Z0-9_-]/g, "");
    console.log(reqMobile);
    console.log(reqDialCode);
    if (reqMobile && reqDialCode) {
      let query = User.where({
        "mobile.dialCode": reqDialCode,
        "mobile.phoneNumber": reqMobile
      });
      query.findOne((err, user) => {
        if (user) {
          let otp_val = 1000 + Math.floor(Math.random() * 8999);

          let { genOtpHash } = new User();
          let otpHash = genOtpHash(otp_val);
          let otp = {
            value: genOtpHash(otp_val),
            _id: user._id
          };

          /* Set OTP to DB */

          User.update(
            { _id: user._id },
            { $set: { otpHash: otpHash } },
            err => {
              if (err) {
                return res.status(500).json({
                  message: "Internal server error"
                });
              }
              /* Sending otp with twilio */
              sendOTP("+" + reqDialCode + reqMobile, otp_val, (err, msg) => {
                if (msg)
                  return res.json({
                    msg: "OTP sent successfully",
                    error: false
                  });
                else
                  return res.json({
                    errorTag: 105,
                    message: err.message
                  });
              });
            }
          );
        } else {
          return res.json({
            error: true,
            message: "Mobile not Registered"
          });
        }
      });
    } else {
      return res.json({
        msg: "Provide mobile",
        error: true
      });
    }
  },

  // verify whether token is valid to reset password

  verifyEmailToken: (req, res, next) => {
    //This is a middleware to compute validity of token
    let token = req.body.token;
    if (token) {
      jwt.verify(token, __.secret, (err, decoded) => {
        if (err) {
          console.log("error block", err);
          return res.status(200).json({
            errorTag: 103,
            tokenValid: false,
            user: null,
            err: err,
            message: "Token expired"
          });
        } else {
          let query = { _id: decoded._id };
          if (!decoded.new) {
            query.forgetPasswordToken = decoded.forgetPasswordToken;
          }
          User.findOne(query, (err, user) => {
            if (user) {
              return res.json({
                tokenValid: true,
                user: user._id
              });
            } else
              return res.status(200).json({
                errorTag: 103,
                tokenValid: false,
                user: null,
                err: err,
                message: "Token expired"
              });
          });
        }
      });
    } else {
      // if there is no token or platform headers
      // return an HTTP response of 403 (access forbidden) and an error message
      return res.status(403).send({
        errorTag: 104,
        message: "Invalid headers"
      });
    }
  },

  resetPassword: (req, res, next) => {
    User.findOne(
      {
        _id: req.body.user
        // forgetPasswordToken: { $ne: "" }
      },
      (err, user) => {
        if (err) {
          return res.status(500).json({
            errorTag: 500,
            message: "Internal server error"
          });
        }
        let newPassword = req.body.password;
        let newSaltAndPass = User(user).getSaltAndPassword(newPassword);
        user.salt = newSaltAndPass.salt;
        user.password = newSaltAndPass.password;
        user.webToken = newSaltAndPass.salt;
        User.findByIdAndUpdate(
          req.body.user,
          {
            $set: {
              salt: newSaltAndPass.salt,
              password: newSaltAndPass.password,
              webToken: newSaltAndPass.salt,
              forgetPasswordToken: ""
            }
          },
          function(err, userUpdated) {
            if (err)
              return res.status(500).json({
                errorTag: 500,
                message: "Internal server error"
              });
            return res.status(200).json({
              message:
                "Password was successfully reset. Please login to continue."
            });
          }
        );
      }
    );
  },

  forgetPassword: async (req, res, next) => {
    try {
      if (!req.body.email) {
        return res.status(400).json({
          message: "Email ID required"
        });
      }

      let user = await User.findOne({
        email: req.body.email
      });
      /* if user not found */
      if (!user) {
        return res.status(404).json({
          errorTag: 100,
          message: "User not found"
        });
      }

      /* reset the user's password so that he couldn't login */
      let newPassword = __.randomChars(8);
      let newSaltAndPass = User(user).getSaltAndPassword(newPassword);
      let forgetPasswordToken = crypto.randomBytes(8).toString("hex");

      let update = {
        $set: {
          salt: newSaltAndPass.salt,
          password: newSaltAndPass.password,
          webToken: newSaltAndPass.salt,
          forgetPasswordToken
        }
      };

      let userData = await User.findOneAndUpdate(
        { email: req.body.email },
        update,
        {
          new: true
        }
      ).lean();

      let token = jwt.sign(
        {
          _id: userData._id,
          forgetPasswordToken
        },
        __.secret,
        {
          expiresIn: "10h"
        }
      );

      let mailData = {
        email: userData.email,
        name: userData.firstName,
        link: `${__.baseUrl()}/set_password?token=${token}`
      };

      mailer.resetPasswordBySuperAdmin(mailData);

      return res.status(200).json({
        message:
          "Password has been reset and a link to set password has been sent"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  resetPasswordBySuperAdmin: async (req, res, next) => {
    try {
      let userId = mongoose.Types.ObjectId(req.body.user);

      let user = await User.findOne({
        _id: userId
      });
      /* if user not found */
      if (!user) {
        return res.status(404).json({
          errorTag: 100,
          message: "User not found"
        });
      }

      /* reset the user's password so that he couldn't login */
      let newPassword = __.randomChars(8);
      let newSaltAndPass = User(user).getSaltAndPassword(newPassword);

      let update = {
        $set: {
          salt: newSaltAndPass.salt,
          password: newSaltAndPass.password,
          webToken: newSaltAndPass.salt
        }
      };

      console.log("update", update);

      let userData = await User.findOneAndUpdate({ _id: userId }, update, {
        new: true
      }).lean();

      let token = jwt.sign(
        {
          _id: userData._id
        },
        __.secret,
        {
          expiresIn: "10h"
        }
      );

      let mailData = {
        email: userData.email,
        name: userData.firstName,
        link: `${__.baseUrl()}/set_password?token=${token}`
      };

      mailer.resetPasswordBySuperAdmin(mailData);

      return res.status(200).json({
        message:
          "Password has been reset and a link to set password has been sent"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  authenticateSubcontractor: (req, res) => {
    console.log("in hereeee", req.body);
    if (isValidEmail(req.body.email) && isValidPass(req.body.password)) {
      Subcontratcor.findOne(
        {
          email: req.body.email
        },
        (err, subcontractor) => {
          if (!subcontractor) {
            return res.status(400).json({
              verified: false,
              message: "Invalid login!"
            });
          } else {
            let expiry = 60 * 60 * 24;
            if (req.body.rememberme) {
              expiry *= 365;
            }
            let token = jwt.sign(
              {
                _id: subcontractor._id,
                mobile: subcontractor.mobile
              },
              superSecret,
              {
                expiresIn: expiry
              }
            );
            subcontractor.webToken = token;
            subcontractor.providerData = {
              lastLogin: Date.now()
            };
            Subcontratcor.findByIdAndUpdate(
              {
                _id: subcontractor._id
              },
              subcontractor,
              (err, subcontractor) => {
                if (err) {
                  return res.json({
                    verified: false,
                    message: "Server Error",
                    status: 500
                  });
                } else {
                  //remove sensitive data
                  subcontractor.password = subcontractor.salt = subcontractor.created = subcontractor.updated = undefined;
                  subcontractor.webToken = subcontractor.mobileToken = subcontractor.authorizationCode = undefined;
                  return res.json({
                    verified: true,
                    user: subcontractor,
                    token: token,
                    status: 200
                  });
                }
              }
            );
          }
        }
      );
    } else {
      return res.status(400).json({
        status: 403,
        message: "Invalid credential format"
      });
    }
  }
};
