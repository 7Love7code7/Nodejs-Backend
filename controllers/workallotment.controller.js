const Work = require("../models/workallotment.model");
const datesAllotments = require("../models/datesAllotment.model");
const moment = require("moment");
const Asset = require("../models/asset.model");
const Company = require("../models/company.model");
const Project = require("../models/project.model");
const _ = require("lodash");

module.exports = {
    createWorkEvent:async(req,res)=>{
        console.log(req.body);
        try{
            let Allotment={};
            Allotment.companyId = req.user.companyId;
            Allotment.listUsers = req.body.listUsers;
            Allotment.listAvailability = req.body.listAvilability;
            Allotment.location = req.body.location;
            Allotment.workername = req.body.name;
            Work(Allotment).save((err, workObj) => {
             workObj.listAvailability.map(work=>{
                 console.log("WORK: ",work);
                 var startdate=new Date(work.startDate);
                 var strDate = startdate.toISOString().slice(0,10);
                 var enddate=new Date(work.endDate);
                 var endeDate = enddate.toISOString().slice(0,10);
                 console.log("start: ",strDate);console.log("end: ",endeDate);
                for(var i = moment(strDate); i.isSameOrBefore(endeDate); i.add(1,'days')) {
                    console.log("insiled for loop");
                    console.log(i); 
                    let dateObject= 
                    {
                        date:i,
                        workAllotmentId:workObj._id,
                        companyId:req.user.companyId   
                    }
                    datesAllotments(dateObject).save((err,dateObj)=>{
                    if(dateObj)
                    console.log("saved date object: ",dateObj);
                    else
                    console.log("error saving date object: ",err);
                    });  
                  }
                
             });
              return res.status(200).json({
                  message: "Employee Allotement Saved Successfully.",
                  data:workObj
                });
            })
        }catch(e){
            return res.status(500).json({
                errorTag: 500,
                message: "Internal server error"
              });
        }
       
    },

    getAllWorkerEvents:async(req,res)=>{
        try{
            Work.find({
            }).where({
                companyId: req.user.companyId
            })
            .exec((err, list) => {
                if (!err) {
                  Work.count(
                    {
                      companyId: req.user.companyId
                     
                    },
                    (err, count) => {
                      if (!err)
                        return res.status(200).json({
                          total: count,
                          list: list
                        });
                      else
                        return res.status(500).json({
                          errorTag: 100,
                          message: err.message
                        });
                    }
                  );
               }
          })
        }catch(e){
            return res.status(500).json({
                errorTag: 500,
                message: "Internal server error"
              });
        }
    },

    getWorkEventById:async(req,res)=>{
        let id = req.params.id;
        try{
            if (id) {
                Work.findById(id)
                  
                  .exec((err, allotobj) => {
                    if (allotobj) {
                      return res.json(allotobj);
                    } else {
                      return res.status(500).json({
                        err: 500,
                        message: "error fetching workers date details"
                      });
                    }
                  });
              } else {
                return res.status(401).json({
                  errorTag: 101,
                  message: "parameter error"
                });
              }

        }catch(e){
            return res.status(500).json({
                errorTag: 500,
                message: "Internal server error"
            });
        }
    },

    deleteWorkAllotment:async(req,res)=>{
        let id = req.params.id;

        if (!id) {
            return res.status(400).json({
                message: " requested ID is missing"
            })
        }
        try {

            let updatedemp = await Work.findByIdAndRemove({
                _id: id
            })

            /* Save all changes */
            await updatedemp.save();

            return res.status(200).json({
                message: "Allotment Object deleted successfully"
            })
        } catch (e) {
            console.log(e)
            return res.status(500).json({
                message: "Internal server error"
            })
        } 
    },

    updateWorkEvent:async(req,res)=>{
        let id = req.params.id;
        let newallotment=req.body
        if(id){
            Work.findById(id)
            .exec((err,work)=>{
                if(work){
                    work.save();
                    return res.status(200).json({
                        message: "Worker allotment updated successfully."
                      });
                }else{
                    return res.status(500).json({
                        err: 304,
                        message: " requested allotment object does not found."
                      });
                }
            })
        }else{
            return res.status(401).json({
                errorTag: 101,
                message: "parameter error"    
              });
        }
    },

    getWorkersWithinDates : async(req,res)=>{
       console.log("req.body",req.query);
       
        try{
            datesAllotments.find({
                date: {
                    $gte: new Date(req.query.startDate),
                    $lt: new Date(req.query.endDate)
                }
            }).where({
                companyId: req.user.companyId
            })
            .exec((err, list) => {
                if (!err) {
                    let arraytemp=[];
                    list.map(listobject=>{
                      arraytemp.push(listobject.workAllotmentId.toString());
                     
                    })
                    var uniqueItems = Array.from(new Set(arraytemp))
                    console.log(uniqueItems);
                    Work.find({_id: {$in: uniqueItems}}, function (err, array) {
                        if (err) {
                          // handle error
                          return res.status(304).json({
                            errorTag: 304,
                            message: err   
                          });
                        } else {
                          console.log("array: ",array);
                        }

                        return res.status(200).json({
                            list:array
                           });
                      });
               }else{
                return res.status(304).json({
                    errorTag: 304,
                    message: err   
                  });
               }
          })

        }catch(e){
            return res.status(500).json({
                errorTag: 500,
                message: "Internal server"    
              });
        }



    },


    
}

