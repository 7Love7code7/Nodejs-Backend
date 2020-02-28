const CompanyUpdate          = require('../models/companyUpdate.model');
const Company          = require("../models/company.model")
const User             = require('../models/user.model');
const __ = require('../helper/globals');

const sanitizeNotification = (val) => {
    
    return val
}

module.exports = {

    createCompanyUpdate   : (req,res) => {
        let companyUpdate = req.body;
        CompanyUpdate(companyUpdate).save((err,update) => {
            if(err){
                return res.status(500).json({err : 500, message : err+"error saving notification"});
            }
            else{
                return res.json(update);
            }
        })
    },

    listAllCompanyUpdatesForRoofer : (req,res) => {
        let roofer = req.user;
        CompanyUpdate.find({"recipientList.rooferId" : roofer._id})
                    .exec((err,list)=>{
                        if(err){
                            return res.status(500).json({errorTag : 100, message : err.message})
                        }
                        else{
                            return res.json(list)
                        }
                    })
    },

    listAllCompanyUpdates : (req,res) => {
        let chunk = null, page = null;
        if(req.query.chunk && req.query.page){
            chunk = parseInt(req.query.chunk);
            page = parseInt(req.query.page);
        }
        let search = "";
        let regex = null;
        if(req.query.search){
            regex = new RegExp(req.query.search,'gi');
        }
        else{
            regex = new RegExp();
        }
        let s = (page - 1) * chunk;
        CompanyUpdate.find({'message' : regex})
                .where({companyId : req.user.companyId})
                .skip(s)
                .limit(chunk)
                .exec((err,list) => {
                    console.log(list,s,chunk)
                    if(err){
                        return res.status(500).json({errorTag : 100, message : err.message})
                    }
                    CompanyUpdate.count({
                        companyId : req.user.companyId
                        },(err,count) => {
                            return res.status(200).json({total : count,list : list})
                        })
                })
    },

    getCompanyUpdateById      :   (req,res) => {
        CompanyUpdate.find({_id : req.params.h_id, companyId : req.user.companyId}).exec((err,list) => {
            if(list){
                return res.json(list);
            }
            else{
                return res.status(500).json({err : 500, message : "error fetching list"});
            }
        })
    },

    deleteCompanyUpdateById   :   (req,res) => {
        CompanyUpdate.findByIdAndRemove(req.params.h_id, (err,result) => {
            if(result)
                return res.status(200).json(result)
            else
                return res.status(500).json(err)    
        })
    },

    createBulkCompanyUpdate : (req,res) => {
        if(!req.user.companyId){
            return res.json({error : "this user can't do that"})
        }
        var reported = 0;
        let admin = req.user;
        let companyUpdateList = req.body;
        companyUpdateList.map((day) => {
            day.companyId = admin.companyId;
            day.providerData = {addedBy : {_id : admin._id, name : admin.firstName + " " + admin.lastName}}
        })
        let report = () => {
            reported = reported + 1;
            if(reported == companyUpdateList.length)
                return res.send(reported + ' added');
        }
        companyUpdateList.forEach(function(companyUpdate){
            CompanyUpdate(companyUpdate).save((err,day) => {
                if(day){
                    Company.findByIdAndUpdate(req.user.companyId,
                        {$push : {"companyUpdates" : day._id},$set : { updated : Date.now()}},
                        {safe : true, upsert : true, new : true},
                        (err,result) => {
                            if(result){
                                report();
                            }
                            else
                                return res.status(500).json({error : 500 , message : err.message})    
                    })
                }
                else{
                    return res.status(403).json({error : 403 , message : err.message})                
                }
            })
        })
    },
    
    updateCompanyUpdatePic    : (req,res) => {
        return res.json({message : "not implemented yet"})
    },

}