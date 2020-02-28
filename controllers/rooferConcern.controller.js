const RooferConcern = require('../models/rooferConcern.model');
const Company = require("../models/company.model");
const User = require('../models/user.model');
const moment = require('moment');

const sanitizeNotification = (val) => {

    return val
}

module.exports = {

    createRooferConcern: (req, res) => {
        let rooferConcern = req.body;
        rooferConcern.companyId = req.user.companyId;
        rooferConcern.creatorId = req.user._id;
        RooferConcern(rooferConcern).save((err, concern) => {
            if (err) {
                return res.status(500).json({ err: 500, message: err.message });
            }
            else {
                return res.json(concern);
            }
        })
    },

    listAllRooferConcernsForRoofer: (req, res) => {
        let roofer = req.user;
        RooferConcern.find({ "creatorId": roofer._id })
            .exec((err, list) => {
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err.message })
                }
                else {
                    return res.json(list)
                }
            })
    },

    listAllRooferConcerns: (req, res) => {
        let chunk = null, page = null;
        let minDate = new Date(-8640000000000000);
        let maxDate = new Date(8640000000000000);
        let opts = {};
        if (req.query.rooferId) {
            opts.creatorId = req.query.rooferId
        }
        if (req.query.projectId) {
            opts.projectId = req.query.projectId
        }
        if (req.query.chunk && req.query.page) {
            chunk = parseInt(req.query.chunk);
            page = parseInt(req.query.page);
        }
        if (req.query.minDate || req.query.maxDate) {
            minDate = req.query.minDate ? new Date(req.query.minDate) : minDate;
            maxDate = req.query.maxDate ? new Date(req.query.maxDate) : maxDate;
            if (minDate > maxDate) {
                //handle invalid date
                return res.json({ errorTag: 106, message: "invalid date query" })
            }
            opts.date = { $gte: minDate, $lte: maxDate };
        }
        if (req.query.forDate) {
            let start = new Date(moment(req.query.forDate).startOf('date').toDate());
            let end = new Date(moment(req.query.forDate).endOf('date').toDate());
            opts.date = { $gte: start, $lte: end }
        }
        let search = "";
        let regex = null;
        if (req.query.search) {
            regex = new RegExp(req.query.search, 'gi');
        }
        else {
            regex = new RegExp();
        }
        opts.message = regex;
        let s = (page - 1) * chunk;
        RooferConcern.find(opts).populate('projectId').populate('creatorId')
            .where({ companyId: '592274e32d8bd076ee0dea71' })
            .skip(s)
            .limit(chunk)
            .exec((err, list) => {
                console.log(list, s, chunk)
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err.message })
                }
                RooferConcern.count({
                    companyId: '592274e32d8bd076ee0dea71'
                }, (err, count) => {
                    return res.status(200).json({ total: count, list: list })
                })
            })
    },

    getRooferConcernById: (req, res) => {
        RooferConcern.find({ _id: req.params.h_id, companyId: req.user.companyId }).exec((err, list) => {
            if (list) {
                return res.json(list);
            }
            else {
                return res.status(500).json({ err: 500, message: "error fetching list" });
            }
        })
    },

    deleteRooferConcernById: (req, res) => {
        RooferConcern.findByIdAndRemove(req.params.h_id, (err, result) => {
            if (result)
                return res.status(200).json(result)
            else
                return res.status(500).json(err)
        })
    },

    createBulkRooferConcern: (req, res) => {
        if (!req.user.companyId) {
            return res.json({ error: "this user can't do that" })
        }
        var reported = 0;
        let admin = req.user;
        let rooferConcernList = req.body;
        rooferConcernList.map((day) => {
            day.companyId = admin.companyId;
            day.providerData = { addedBy: { _id: admin._id, name: admin.firstName + " " + admin.lastName } }
        })
        let report = () => {
            reported = reported + 1;
            if (reported == rooferConcernList.length)
                return res.send(reported + ' added');
        }
        rooferConcernList.forEach(function (rooferConcern) {
            RooferConcern(rooferConcern).save((err, day) => {
                if (day) {
                    Company.findByIdAndUpdate(req.user.companyId,
                        { $push: { "rooferConcerns": day._id }, $set: { updated: Date.now() } },
                        { safe: true, upsert: true, new: true },
                        (err, result) => {
                            if (result) {
                                report();
                            }
                            else
                                return res.status(500).json({ error: 500, message: err.message })
                        })
                }
                else {
                    return res.status(403).json({ error: 403, message: err.message })
                }
            })
        })
    },
    
    updateRooferConcernPic: (req, res) => {
        return res.json({ message: "not implemented yet" })
    }
}