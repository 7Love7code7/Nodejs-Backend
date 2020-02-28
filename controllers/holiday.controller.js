const Holiday = require("../models/holiday.model");
const Company = require("../models/company.model");
const User = require("../models/user.model");

module.exports = {
  createHoliday: (req, res) => {
    let holiday = req.body;
    holiday.companyId = req.user.companyId;
    holiday.createdBy = req.user._id;
    holiday.updatedBy = req.user._id;
    Holiday(holiday).save((err, day) => {
      if (err) {
        return res.status(500).json({ err: 500, message: "error saving day" });
      } else {
        return res.json(day);
      }
    });
  },

  listAllHolidays: (req, res) => {
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
    Holiday.find({ name: regex })
      .where({ companyId: req.user.companyId })
      .where({ isActive: true })
      .skip(s)
      .limit(chunk)
      .exec((err, list) => {
        if (err) {
          return res.status(500).json({ errorTag: 100, message: err.message });
        }
        Holiday.count(
          {
            companyId: req.user.companyId
          },
          (err, count) => {
            return res.status(200).json({ total: count, list: list });
          }
        );
      });
  },

  getHolidayById: (req, res) => {
    console.log(req.params.h_id);
    Holiday.find({ _id: req.params.h_id, companyId: req.user.companyId }).exec((err, list) => {
      if (list) {
        return res.json(list);
      } else {
        return res.status(500).json({ err: 500, message: "error fetching list" });
      }
    });
  },

  deleteHolidayById: (req, res) => {
    // Holiday.findByIdAndRemove(req.params.h_id, (err, result) => {
    //   if (result) return res.status(200).json(result);
    //   else return res.status(500).json(err);
    // });
    Holiday.findByIdAndUpdate(req.params.h_id, { $set: { isActive: false } }, {upsert: false}, (err, result) => {
        if(result)
           return res.status(200).json(result);
        else
           return res.status(500).json(err);
    });
  },

  createBulkHoliday: (req, res) => {
    if (!req.user.companyId) {
      return res.json({ error: "this user can't do that" });
    }
    var reported = 0;
    let admin = req.user;
    let holidayList = req.body;
    holidayList.map(day => {
      day.companyId = admin.companyId;
      day.providerData = {
        addedBy: { _id: admin._id, name: admin.firstName + " " + admin.lastName }
      };
    });
    let report = () => {
      reported = reported + 1;
      if (reported == holidayList.length) return res.send(reported + " added");
    };
    holidayList.forEach(function(holiday) {
      Holiday(holiday).save((err, day) => {
        if (day) {
          Company.findByIdAndUpdate(
            req.user.companyId,
            { $push: { holidays: day._id }, $set: { updated: Date.now() } },
            { safe: true, upsert: true, new: true },
            (err, result) => {
              if (result) {
                report();
              } else return res.status(500).json({ error: 500, message: err.message });
            }
          );
        } else {
          return res.status(403).json({ error: 403, message: err.message });
        }
      });
    });
  },

  updateHolidayById: (req, res) => {
    let id = req.params.h_id;
    let day = req.body;
    day.updatedBy = req.user._id;
    console.log(id);
    if (id) {
      Holiday.findByIdAndUpdate(id, day, (err, holiday) => {
        if (holiday) {
          return res.json(holiday);
        } else {
          return res.status(500).json({ errorTag: 100, message: err.message });
        }
      });
    } else {
      return res.status(401).json({ errorTag: 101, message: "parameter error" });
    }
  },

  updateHolidayPic: (req, res) => {
    return res.json({ message: "not implemented yet" });
  }
};
