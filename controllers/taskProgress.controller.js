const TaskProgress = require('../models/taskProgress.model');
const moment = require('moment');

module.exports = {
    
    createTaskProgressForProject: (req, res) => {
        let user = req.user;
        let taskProgress = req.body;
        let pid = req.params.p_id;
        if (taskProgress) {
            taskProgress.companyId = user.companyId;
            taskProgress.rooferId = user._id;
            taskProgress.projectId = pid;
            taskProgress.providerData = { createdBy: user.displayName, id: user._id };
            TaskProgress(taskProgress).save((err, t) => {
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err.message });
                }
                else {
                    return res.json(t);
                }
            })
        }
        else {
            return res.json({ errorTag: 102, message: "No taskProgress found in body" })
        }
    },

    listAllTaskProgresss: (req, res) => {
        let user = req.user;
        let chunk = null, page = null;
        let minDate = new Date(-8640000000000000);
        let maxDate = new Date(8640000000000000);
        let opts = {};
        if (req.query.chunk && req.query.page) {
            chunk = parseInt(req.query.chunk);
            if (chunk < 2)
                chunk = 2;
            page = parseInt(req.query.page);
            if (page < 1)
                page = 1;
        }
        let search = "";
        let regex = null;
        if (req.query.search) {
            regex = new RegExp(req.query.search, 'gi');
        }
        else {
            regex = new RegExp();
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
        let s = (page - 1) * chunk;
        TaskProgress.find({ 'taskProgressDescription': regex, companyId: user.companyId })
            .where(opts)
            .skip(s)
            .limit(chunk)
            .exec((err, list) => {
                if (err) {
                    return res.status(500).json({ errorTag: 101, message: err.message })
                }
                TaskProgress.count({
                    companyId: user.companyId
                }, (err, count) => {
                    return res.status(200).json({ total: count, list: list })
                })
            })
    },

    listTaskProgressByProjectId: (req, res) => {
        let user = req.user;
        let pid = req.params.p_id;
        let rooferId = req.query.rooferId;
        let minDate = new Date(-8640000000000000);
        let maxDate = new Date(8640000000000000);
        let opts = {};
        if(rooferId){
            opts.rooferId = rooferId;
        }
        if (!pid) {
            return res.json({ errorTag: 101, message: "couldn't resovle projectId" })
        }
        let chunk = null, page = null;
        if (req.query.chunk && req.query.page) {
            chunk = parseInt(req.query.chunk);
            if (chunk < 2)
                chunk = 2;
            page = parseInt(req.query.page);
            if (page < 1)
                page = 1;
        }
        let search = "";
        let regex = null;
        if (req.query.search) {
            regex = new RegExp(req.query.search, 'gi');
        }
        else {
            regex = new RegExp();
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
        let s = (page - 1) * chunk;
        TaskProgress.find({ 'taskProgressDescription': regex, projectId: pid })
            .where(opts)
            .skip(s)
            .limit(chunk)
            .exec((err, list) => {
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err.message })
                }
                TaskProgress.count({
                    projectId: pid
                }, (err, count) => {
                    return res.status(200).json({ total: count, list: list })
                })
            })
    },

    listTaskProgressByRooferId: (req, res) => {
        let user = req.user;
        let id = req.params.r_id;
        let chunk = null, page = null;
        if (req.query.chunk && req.query.page) {
            chunk = parseInt(req.query.chunk);
            if (chunk < 2)
                chunk = 2;
            page = parseInt(req.query.page);
            if (page < 1)
                page = 1;
        }
        let search = "";
        let regex = null;
        if (req.query.search) {
            regex = new RegExp(req.query.search, 'gi');
        }
        else {
            regex = new RegExp();
        }
        let s = (page - 1) * chunk;
        TaskProgress.find({ 'taskProgressDescription': regex })
            .where({ rooferId: id })
            .skip(s)
            .limit(chunk)
            .exec((err, list) => {
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err.message })
                }
                TaskProgress.count({
                    rooferId: id
                }, (err, count) => {
                    return res.status(200).json({ total: count, list: list })
                })
            })
    },

    getTaskProgressById: (req, res) => {
        let id = req.params.t_id;
        TaskProgress.findById(id, (err, taskProgress) => {
            if (taskProgress) {
                return res.json(taskProgress);
            }
            else {
                return res.status(500).json({ errorTag: 100, message: "error fetching list" });
            }
        });
    },

    updateTaskProgressById: (req, res) => {
        let id = req.params.t_id;
        let taskProgress = req.body;
        console.log(id);
        TaskProgress.findByIdAndUpdate(id, taskProgress, (err, t) => {
            if (taskProgress) {
                return res.json(t);
            }
            else {
                return res.status(500).json({ errorTag: 100, message: "error fetching list" });
            }
        });
    }
}