const Company = require('../models/company.model');
const User = require('../models/user.model');
const Task = require('../models/task.model');

module.exports = {

    createTaskForProject: (req, res) => {
        let user = req.user;
        let task = req.body;
        let pid = req.params.p_id;
        if (task) {
            task.companyId = user.companyId;
            task.projectId = pid;
            task.providerData = { createdBy: user.displayName, id: user._id };
            Task(task).save((err, t) => {
                if (err) {
                    return res.status(500).json({ err: 500, message: "error adding task" });
                }
                else {
                    return res.json(t);
                }
            })
        }
        else {
            return res.json({ errorTag: 102, message: "No task found in body" })
        }
    },

    listAllTasks: (req, res) => {
        let user = req.user;
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
        Task.find({ 'taskName': regex, isActive: true })
            .where({ companyId: user.companyId })
            .skip(s)
            .limit(chunk)
            .exec((err, list) => {
                if (err) {
                    return res.status(500).json({ errorTag: 101, message: err.message })
                }
                Task.count({
                    companyId: user.companyId
                }, (err, count) => {
                    return res.status(200).json({ total: count, list: list })
                })
            })
    },

    listTaskByProjectId: (req, res) => {
        let user = req.user;
        let pid = req.params.p_id;
        let chunk = null, page = null;
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
        let minDate = new Date(-8640000000000000);
        let maxDate = new Date(8640000000000000);
        if (req.query.search) {
            regex = new RegExp(req.query.search, 'gi');
        }
        else {
            regex = new RegExp();
        }
        if (req.query.minDate && req.query.maxDate) {
            minDate = new Date(req.query.minDate);
            maxDate = new Date(req.query.maxDate);
            if (minDate > maxDate) {
                //handle invalid date
                return res.json({ errorTag: 106, message: "invalid date query" })
            }
            opts.startDate = { $gte : minDate};
            opts.endDate = { $lte : maxDate};
        }
        if (req.query.forDate) {
            let forDate = new Date(req.query.forDate);
            opts.startDate = { $lte: forDate };
            opts.endDate = { $gte: forDate };
        }
        let s = (page - 1) * chunk;
        Task.find({ 'taskName': regex, isActive: true, projectId: pid})
            .where(opts)
            // .where('startDate')
            // .gte(minDate)
            // .where('endDate')
            // .lte(maxDate)
            .skip(s)
            .limit(chunk)
            .exec((err, list) => {
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err.message })
                }
                Task.count({
                    projectId: pid
                }, (err, count) => {
                    return res.status(200).json({ total: count, list: list })
                })
            })
    },

    getTaskById: (req, res) => {
        let id = req.params.t_id;
        Task.findById(id, (err, task) => {
            if (task) {
                return res.json(task);
            }
            else {
                return res.status(500).json({ errorTag: 100, message: "error fetching list" });
            }
        })
    },
    
    deleteTaskById: (req, res) => {
        let id = req.params.t_id;
        Task.findByIdAndUpdate(id, { $set: { isActive: false } }, (err, task) => {
            if (task) {
                return res.json(task);
            }
            else {
                return res.status(500).json({ errorTag: 100, message: "error fetching list" });
            }
        })
    },
    
    updateTaskById: (req, res) => {
        let id = req.params.t_id;
        let task = req.body;
        if (task) {
            Task.findByIdAndUpdate(id, task, (err, t) => {
                if (task) {
                    return res.json(t);
                }
                else {
                    return res.status(500).json({ errorTag: 100, message: "error fetching list" });
                }
            })
        }
        else {
            return res.status(401).json({ errorTag: 101, message: "parameter error" })
        }
    }
}