const Project = require('../models/project.model');
const RooferAllotment = require('../models/rooferAllotment.model');
const mongoose = require('mongoose');

const assign = (project, ra) => {
    if (!project.rooferAllotment)
        project.rooferAllotment = {};
    if (!project.teamLeaderAllotment)
        project.teamLeaderAllotment = {};

    if (ra.isLeader) {
        project.rooferAllotment[ra.rooferId] = ra.rooferName;
        project.teamLeaderAllotment[ra.rooferId] = ra.rooferName;
    }
    else
        project.rooferAllotment[ra.rooferId] = ra.rooferName;

    return project;
}

const getList = (list) => {
    let ret = [];
    list.forEach((element) => {
        if (ret.indexOf(element.projectId) == -1) {
            ret.push(new mongoose.Types.ObjectId(element.projectId));
        }
    })
    console.log(ret);
    return ret;
}

module.exports = {

    createRooferAllotment: (req, res) => {
        let user = req.user;
        let rooferAllotment = req.body;
        console.log(rooferAllotment);
        console.log('Break');
        console.log('user',user);
        if (rooferAllotment) {
            rooferAllotment.companyId = user.companyId;
            rooferAllotment.providerData = { createdBy: user.displayName, id: user._id };
            RooferAllotment(rooferAllotment).save((err, ra) => {
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err+"error adding rooferAllotment" });
                }
                else {
                    //insert record in project
                    if (ra.projectId) {
                        Project.findById(ra.projectId, (err, project) => {
                            // console.log(project);
                             console.log(ra);
                            project = assign(project, ra);
                            console.log(project)
                            Project.findByIdAndUpdate(ra.projectId, project, (err, result) => {
                                if (result)
                                    return res.json(ra);
                                else
                                    return res.status(500).json({ errorTag: 100, message: err.message })
                            })
                        })
                    }
                    else {
                        return res.json(ra)
                    }
                }
            })
        }
        else {
            return res.json({ errorTag: 102, message: "No rooferAllotment found in body" })
        }
    },

    listAllRooferAllotmentsByRooferId: (req, res) => {
        let user = req.user;
        let rooferId = req.params.r_id;
        let chunk = null, page = null;
        let opts = {};
        let minDate = new Date(-8640000000000000);
        let maxDate = new Date(8640000000000000);
        if(req.query.minDate)
            minDate = new Date(req.query.minDate)
        if(req.query.maxDate)
            maxDate = new Date(req.query.maxDate)
        if (req.query.projectId) {
            opts.projectId = req.query.projectId;
        }
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
        RooferAllotment.find({ 'rooferName': regex })
            .populate('projectId')
            .where({ companyId: user.companyId, rooferId: rooferId })
            .where(opts)
            .where('from').gte(minDate)
            .where('to').lte(maxDate)
            .skip(s)
            .limit(chunk)
            .exec((err, list) => {
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err.message })
                }
                RooferAllotment.count({
                    companyId: user.companyId,
                    rooferId: rooferId
                }, (err, count) => {
                    return res.status(200).json({ total: count, list: list })
                })
            })
    },

    listAllRooferAllotmentsByProjectId: (req, res) => {
        let user = req.user;
        let projectId = req.params.p_id;
        console.log("user", user);
        console.log("projectId", projectId);
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
        RooferAllotment.find({ 'rooferName': regex })
            .where({ companyId: user.companyId, projectId: projectId })
            .skip(s)
            .limit(chunk)
            .exec((err, list) => {
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err.message })
                }
                RooferAllotment.count({
                    companyId: user.companyId,
                    projectId: projectId
                }, (err, count) => {
                    return res.status(200).json({ total: count, list: list })
                })
            })
    },
    
    getRooferAllotmentById: (req, res) => {
        let id = req.params.ra_id;
        RooferAllotment.findById(id, (err, rooferAllotment) => {
            if (rooferAllotment) {
                return res.json(rooferAllotment);
            }
            else {
                return res.status(500).json({ errorTag: 100, message: err.message });
            }
        })
    },

    updateRooferAllotmentById: (req, res) => {
        let id = req.params.ra_id;
        let rooferAllotment = req.body;
        RooferAllotment.findByIdAndUpdate(id, rooferAllotment, (err, t) => {
            if (t) {
                return res.json(t);
            }
            else {
                return res.status(500).json({ errorTag: 100, message: err.message });
            }
        })
    },

    deleteRooferAllotmentById: (req, res) => {
        let id = req.params.ra_id;
        let rooferAllotment = req.body;
        RooferAllotment.findByIdAndRemove(id, (err, t) => {
            if (t) {
                return res.json(t);
            }
            else {
                return res.status(500).json({ errorTag: 100, message: err.message });
            }
        })
    },
    
    listProjectByAllotment: (req, res) => {
        
        let user = req.user;
        let rooferId = user._id;
        let chunk = null, page = null, active = null;
        let lat = lng = 0;
        let opts = {};
        opts.companyId = user.companyId;
        let minDate = new Date(-8640000000000000);  //Filter for project
        let maxDate = new Date(8640000000000000);   //Filter for project
        let aMinDate = new Date(-8640000000000000); //Filter for Allotments
        let aMaxDate = new Date(8640000000000000);  //Filter for Allotments
        if (req.query.chunk && req.query.page) {
            chunk = parseInt(req.query.chunk);
            page = parseInt(req.query.page);
        }
        switch (req.query.active) {
            case "true":
                active = true
                break;
            case "false":
                active = false
                break;
            default:
                active = null;
                break;
        }
        let search = "";
        let regex = null;
        if (req.query.search) {
            regex = new RegExp(req.query.search, 'gi');
        }
        else {
            regex = new RegExp();
        }
        if (req.query.lat && req.query.long) {
            lat = parseFloat(req.query.lat);
            lng = parseFloat(req.query.long);
            opts['address.loc'] = {
                '$near': {
                    '$geometry': { type: "Point", coordinates: [lat, lng] }
                }
            }
        }
        if (req.query.aMinDate && req.query.aMaxDate) {
            aMinDate = new Date(req.query.aMinDate);
            aMaxDate = new Date(req.query.aMaxDate);
            if (aMinDate > aMaxDate) {
                //handle invalid date for allotment
                return res.json({ errorTag: 106, message: "invalid date query" })
            }
        }
        if (req.query.minDate && req.query.maxDate) {
            minDate = new Date(req.query.minDate);
            maxDate = new Date(req.query.maxDate);
            if (minDate > maxDate) {
                //handle invalid date
                return res.json({ errorTag: 106, message: "invalid date query" })
            }
        }
        let s = (page - 1) * chunk;
        RooferAllotment.find({ companyId: user.companyId, rooferId: rooferId })
            .where({
                $or: [
                    { $and: [{ from: { $lte: aMinDate } }, { to: { $gte: aMinDate } }] },
                    { $and: [{ from: { $gt: aMinDate } }, { to: { $lte: aMaxDate } }] },
                    { $and: [{ from: { $lte: aMaxDate } }, { to: { $gte: aMaxDate } }] },
                ]
            })
            .sort('from')
            .exec((err, allotmentList) => {
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err.message })
                }
                let pIdList = getList(allotmentList);
                Project.find({
                    $or: [
                        { 'projectName': regex },
                        { 'projectDescription': regex },
                        { 'client.clientName': regex },
                        { 'address.line1': regex },
                        { 'address.line2': regex },
                        { 'address.line3': regex },
                        { 'address.city': regex }
                    ]
                })
                    .where({ '_id': { $in: pIdList } })
                    .where(opts)
                    .where('startDate')
                    .gte(minDate)
                    .where('endDate')
                    .lte(maxDate)
                    .skip(s)
                    .limit(chunk)
                    .sort(active)
                    .select('_id projectName projectImage startDate endDate address projectStatus isServiceProject created')
                    .exec((err, projects) => {
                        if (projects){
                            return res.json({
                                projects: projects,
                                allotments: allotmentList
                            });
                        }
                        else
                            return res.status(500).json({ errorTag: 107, message: err.message })
                    })
            })
    }
}