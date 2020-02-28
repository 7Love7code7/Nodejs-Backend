const Company = require("../models/company.model");
const __ = require("./globals");

module.exports = {
  isSuperAdmin: (req, res, next) => {
    if (req.user.authorizationCode !== 15) {
      return res.status(403).json({ error: 403, message: "not authorised" });
    } else {
      next();
    }
  },

  isAdmin: (req, res, next) => {
    if (req.user.authorizationCode < 14) {
      console.log("in is admin if");
      return res.status(403).json({ error: 403, message: "not authorised" });
    } else {
      next();
    }
  },

  isManager: (req, res, next) => {
    if (req.user.authorizationCode < 12) {
      console.log("in is manager if");
      return res.status(403).json({ error: 403, message: "not authorised" });
    } else {
      next();
    }
  },

  checkPrivilege: (type, subType) => {
    return async function(req, res, next) {
      try {
        next();
        return;

        // TODO: Temporarily disabling privileges

        let { privileges } = await Company.findOne({ _id: req.user.companyId })
          .select("privileges")
          .lean();

        let userWeight = __.roleWeights[req.user.designation];

        /* Go next if privileges aren't set */
        if (privileges[type] === undefined) {
          next();
          return;
        }

        if (privileges[type][subType] === undefined) {
          next();
          return;
        }
        if (userWeight <= privileges[type][subType]) {
          next();
        } else {
          return res.status(403).json({
            message: "Not authorised"
          });
        }
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    };
  }
};
