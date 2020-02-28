const BuildUp          = require('../models/buildUp.model');
const Company             = require('../models/company.model');
const User             = require('../models/user.model');

module.exports = {

    createBuildUp   : (req,res) => {
        let buildUp = req.body;
        buildUp.companyId = req.user.companyId;
        BuildUp(buildUp).save((err,build) => {
            if(err){
                return res.status(500).json({err : 500, message : "error saving buildUp"});
            }
            else{
                return res.json(build);
            }
        })
    },

    listAllBuildUps : (req,res) => {
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
        BuildUp.find({companyId : req.user.companyId})
                .skip(s)
                .limit(chunk)
                .exec((err,list) => {
                    if(err){
                        return res.status(500).json({errorTag : 100, message : err.message})
                    }
                    BuildUp.count({
                        companyId : req.user.companyId
                        },(err,count) => {
                            if(err){
                                 return res.status(500).json({errorTag : 100, message : err.message})
                            }
                            else{
                                return res.json({total : count,list : list})
                            }
                        })
                })  
    },

    listAllBuildUpsByProjectId : (req,res) => {
        let chunk = null, page = null;
        let projectId = req.params.p_id;
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
        BuildUp.find({companyId : req.user.companyId, projectId : projectId})
                .skip(s)
                .limit(chunk)
                .exec((err,list) => {
                    if(err){
                        return res.status(500).json({errorTag : 100, message : err.message})
                    }
                    BuildUp.count({
                        companyId : req.user.companyId,
                        projectId : projectId
                        },(err,count) => {
                            if(err){
                                 return res.status(500).json({errorTag : 100, message : err.message})
                            }
                            else{
                                return res.json({total : count,list : list})
                            }
                        })
                })  
    },

    listBuildUpByAsset : (req,res) => {
        let chunk = null, page = null;
        let assetId = req.params.a_id;
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
        BuildUp.find({companyId : req.user.companyId, 'asset.assetId' : assetId})
                .skip(s)
                .limit(chunk)
                .exec((err,list) => {
                    if(err){
                        return res.status(500).json({errorTag : 100, message : err.message})
                    }
                    BuildUp.count({
                        companyId : req.user.companyId,
                        'asset.assetId' : assetId
                        },(err,count) => {
                            if(err){
                                 return res.status(500).json({errorTag : 100, message : err.message})
                            }
                            else{
                                return res.json({total : count,list : list})
                            }
                        })
                })  
    },
    
    getBuildUpById      :   (req,res) => {
        let id = req.params.m_id;
        console.log(id);
        if(id){
            BuildUp.findById(id, (err,buildUp) => {
                if(buildUp){
                    return res.json(buildUp);
                }
                else{
                    return res.status(500).json({err : 500, message : "error fetching list"});
                }
            })
        }
        else{
            return res.status(401).json({errorTag : 101, message : "parametre error"})
        }  

    },
    
    deleteBuildUpById   :   (req,res) => {
        if(req.params)
            BuildUp.findByIdAndRemove(req.params.m_id, (err,result) => {
                if(result)
                    return res.status(200).json(result)
                else
                    return res.status(500).json(err)    
            })
    },

    createBulkBuildUp : (req,res) => {
        if(!req.user.companyId){
            return res.json({error : "this user can't do that"})
        }
        let admin = req.user;
        var reported = 0;
        buildUpList = req.body;
        buildUpList.map((buildUp) => {
            buildUp.projectId = req.params.p_id;
            buildUp.companyId = admin.companyId;
            buildUp.providerData = {addedBy : {_id : admin._id, name : admin.firstName + " " + admin.lastName}}
        })
        let report = () => {
            reported = reported + 1;
            if(reported == buildUpList.length)
                return res.send(reported + ' added');
        }
        buildUpList.forEach(function(buildUp){
            BuildUp(buildUp).save((err,mat) => {
                console.log(mat)
                if(mat){
                    Company.findByIdAndUpdate(admin.companyId,
                        {
                            $push : { buildUps : mat._id},
                            $set : { updated : Date.now()}
                        },
                        {safe : true, upsert : true, new : true},
                        (err,result) => {
                            if(result){
                                report();
                            }
                            else{
                                return res.status(500).json({error : 500 , message : err.message})    
                            }
                    })
                }
                else{
                    return res.status(403).json({error : 403 , message : err.message})                
                }
            })
        })
    },

    updateBuildUpPic    : (req,res) => {
        return res.json({message : "not implemented yet"})
    }
}