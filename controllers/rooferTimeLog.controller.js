const request = require("request");
const Company = require('../models/company.model');
const RooferTimeLog = require('../models/rooferTimeLog.model');
const Asset = require("../models/asset.model");
const mongoose = require("mongoose");
const __ = require("../helper/globals");
const user = require("../models/user.model");
const moment = require('moment')

module.exports = {

    createRooferTimeLogForProject: async(req, res) => {
        console.log("IN body:",req.files);
        let user = req.user;
        let rooferTimeLog = req.body;
        console.log("IN body: ",rooferTimeLog);
        let pid = req.params.p_id;
        if (rooferTimeLog) {
            rooferTimeLog.companyId = user.companyId;
            rooferTimeLog.projectId = pid;
            rooferTimeLog.providerData = { createdBy: user.displayName, id: user._id };
            if (req.files && req.files.length > 0) {
                let files = req.files;
                console.log("IN if: ",files);
                files = files.map((element, i) => {
                  element.providerData = {
                    _id: req.user["_id"],
                    email: req.user["email"],
                    name: req.user["firstName"] + " " + req.user["lastName"]
                  };
                  element.assetName = element.originalname;
                  element.companyId = req.user.companyId;
                  return element;
                });
        
             //   files = _.flatten(files);
        
                let receipts = await Asset.insertMany(files);
                rooferTimeLog.listReceipts =[];
                receipts.map(reciept=>{
                    rooferTimeLog.listReceipts.push(reciept._id)
                })
                
              }
            RooferTimeLog(rooferTimeLog).save((err, t) => {
                if (err) {
                    return res.status(500).json({ err: 500, message: "error adding rooferTimeLog" });
                }
                else {
                    return res.json(t);
                }
            })

            

         
        }
        else {
            return res.json({ errorTag: 102, message: "No rooferTimeLog found in body" })
        }
    },

    listAllRooferTimeLogs: (req, res) => {
        let user = req.user;
        let chunk = null, page = null;
        let opts = {};
        if(req.query.projectId){
            opts.projectId = req.query.projectId;
        }
        if(req.query.rooferId){
            opts.rooferId = req.query.rooferId;
        }
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
        RooferTimeLog.find({ isActive: true })
            .where({ companyId: user.companyId })
            .where(opts)
            .where('from').gte(minDate)
            .where('to').lte(maxDate)
            .skip(s)
            .limit(chunk)
            .exec((err, list) => {
                if (err) {
                    return res.status(500).json({ errorTag: 101, message: err.message })
                }
                RooferTimeLog.count({
                    companyId: user.companyId
                }, (err, count) => {
                    return res.status(200).json({ total: count, list: list })
                })
            })
    },

    listRooferTimeLogByProjectId: (req, res) => {
        let user = req.user;
        let pid = req.params.p_id;
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
        if (req.query.minDate || req.query.maxDate) {
            minDate = req.query.minDate ? new Date(req.query.minDate) : minDate;
            maxDate = req.query.maxDate ? new Date(req.query.maxDate) : maxDate;
            if (minDate > maxDate) {
                //handle invalid date
                return res.json({ errorTag: 106, message: "invalid date query" })
            }
            opts.date = { $gte: minDate , $lte: maxDate};
        }
        if (req.query.forDate) {
            let start = new Date(moment(req.query.forDate).startOf('date').toDate());
            let end = new Date(moment(req.query.forDate).endOf('date').toDate());
            opts.date = { $gte: start, $lte: end }
        }
        let s = (page - 1) * chunk;
        RooferTimeLog.find({ projectId: pid, isActive: true })
            .where(opts)
            .skip(s)
            .limit(chunk)
            .exec((err, list) => {
                if (err) {
                    return res.status(500).json({ errorTag: 100, message: err.message })
                }
                RooferTimeLog.count({
                    projectId: pid
                }, (err, count) => {
                    return res.status(200).json({ total: count, list: list })
                })
            })
    },

    getRooferTimeLogById: (req, res) => {
        let id = req.params.t_id;
        RooferTimeLog.findById(id, (err, rooferTimeLog) => {
            if (rooferTimeLog) {
                return res.json(rooferTimeLog);
            }
            else {
                return res.status(500).json({ errorTag: 100, message: "error fetching list" });
            }
        })
    },
    deleteRooferTimeLogById: (req, res) => {
        let id = req.params.t_id;
        RooferTimeLog.findByIdAndUpdate(id, { $set: { isActive: false } }, (err, rooferTimeLog) => {
            if (rooferTimeLog) {
                return res.json(rooferTimeLog);
            }
            else {
                return res.status(500).json({ errorTag: 100, message: "error fetching list" });
            }
        })
    },
    
    updateRooferTimeLogById: async(req, res) => {
        console.log("in update");
        let id = req.params.t_id;
        console.log("files: ",req.files);
        console.log("id ", id);
        let rooferTimeLog = req.body;
        console.log("rooferTimeLog" ,rooferTimeLog)
        try{
            if (!req.params.t_id) {
                return res.status(400).json({
                  message: "Time Log id is missing"
                });
            }
            if (req.files && req.files.length > 0) {
                let files = req.files;
                console.log("IN if: ",files);
                files = files.map((element, i) => {
                  element.providerData = {
                    _id: req.user["_id"],
                    email: req.user["email"],
                    name: req.user["firstName"] + " " + req.user["lastName"]
                  };
                  element.assetName = element.originalname;
                  element.companyId = req.user.companyId;
                  return element;
                });
             //   files = _.flatten(files);
                let receipts = await Asset.insertMany(files);
              await RooferTimeLog.findById({_id:req.params.t_id},function(err,log){
                console.log("finging fanny",receipts);
                
                console.log("receiptsin logs",log.listReceipts);
                
                if(req.body.listReceipts){
                    log.listReceipts.map((receipt,i)=>{
                       if(req.body.includes(receipt)){
                         console.log("found");
                       }else{
                        var assetToDelete = Asset.findByIdAndRemove({_id:receipt});
                        log.listReceipts.splice(i,1);
                       }
                   });
                }
                receipts.map(reciept=>{
                    log.listReceipts.push(reciept._id)
                });
                console.log("here");
                rooferTimeLog.listReceipts=log.listReceipts;
              });
                
                //await RooferTimeLog.update({ _id: req.params.t_id }, { $set: {listReceipts:rooferLog.listReceipts}});
            }
            await RooferTimeLog.update({ _id: req.params.t_id }, { $set: rooferTimeLog });
            return res.status(200).json({
                message: "Roofer Log updated successfully."
            });
        }catch (e) {
          console.log(e);
          return res.status(500).json({
            message: "Internal server error"
          });
        }
        // if (rooferTimeLog) {
        //     RooferTimeLog.findByIdAndUpdate(id, rooferTimeLog, (err, t) => {
        //         if (rooferTimeLog) {
        //             return res.json(t);
        //         }
        //         else {
        //             return res.status(500).json({ errorTag: 100, message: "error fetching list" });
        //         }
        //     })
        // }
        // else {
        //     return res.status(401).json({ errorTag: 101, message: "parameter error" })
        // }
    }
}