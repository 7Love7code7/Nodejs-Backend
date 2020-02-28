const Events = require('../models/events.model');
const Asset = require("../models/asset.model");
const _ = require('lodash');
const mime = require("mime-types");

module.exports = {
    /**
     * Create Event
     */
    createNewEvent:async (req, res) => {
        console.log('***************** Create Event List *****************');
        try{
            let lAryListMembers = _.compact(req.body.listMembers)
            let files = req.files;

            files = files.map((x, i) => {
                x.companyId = req.user.companyId;
                x.assetName = x.originalname;
                x.projectId = req.body.projectId;
                x.providerData = {
                  name: req.user.displayName
                };
                x.assetName = x.originalname;
                x.secure_url = x.url = x.location;
                x.bytes = x.size.toString();
                x.format = mime.extension(x.mimetype);
                return x;
              });
        
              files = await Asset.insertMany(files);

              console.log(req.body.date._d);
              console.log('*******************************************');
            let lObjEventList = await Events.create({
                name : req.body.name,
                agenda : req.body.agenda,
                location : req.body.location,
                userId : req.user,
                listAssets : files.map(x => x._id),
                listMembers: lAryListMembers,
                date:req.body.date,
                time:req.body.time
            });
            console.log(lObjEventList);
            return res.status(200).send({message:'Event added successfully',data:lObjEventList})
        }catch (err){
            console.log(err);
            return res.status(500).send({message:'Error',data:err})
        }
    },
    /**
     * Get All Events 
     */
    getAllEvents:async(req,res)=>{
        try{
            let lObjQueryCondition = (!!req.query.eventId) ? Events.findOne({userId:req.user,_id:req.query.eventId}) : Events.find({userId:req.user})
            let lResData = await lObjQueryCondition.populate('listAssets').lean()
            if(!!req.query.eventId){
                if(lResData.listAssets.length > 0){
                    lResData.listAssets = lResData.listAssets.reduce((acc, x) => {
                            /* Split docs and images */
                            if (/png|jpg|jpeg|gif/.test(x.format)) {
                                acc.images.push(x);
                            } else {
                                acc.docs.push(x);
                            }
                            return acc;
                        },
                        { images: [], docs: [] 
                    });
                }
            }else{
                for(let v of lResData){
                    if(v.listAssets.length > 0){
                        v.listAssets = v.listAssets.reduce((acc, x) => {
                            /* Split docs and images */
                            if (/png|jpg|jpeg|gif/.test(x.format)) {
                                acc.images.push(x);
                            } else {
                                console.log(x);
                                acc.docs.push(x);
                            }
                            return acc;
                        },
                        { images: [], docs: [] }
                    );  
                    }
                }
            }
            return res.status(200).send({
                message:'Events List',
                data:lResData
            })
        }catch (err){
            console.log(err);
            return res.status(500).send({message:'Error',data:err})
        }
    },

    updateMyEvent:async(req,res)=>{
        try{
            let lObjEventId = req.params.eventId;
            let lObjEventResponse = await Events.findOne({_id:lObjEventId}).lean()
            if(!lObjEventResponse)return res.status(400).send({message:'Event not found'})
            req.body.listMembers = _.compact(req.body.listMembers)
            let lObjUpdateEvent = Object.assign({}, lObjEventResponse, req.body)
            let lObjResponse = await Events.findOneAndUpdate({ _id:lObjEventId }, lObjUpdateEvent, { new: true }).lean()
            console.log(lObjResponse)
            return res.status(200).send({message:'Events updated successfully',data:lObjResponse})
        }catch(err){
            console.log(err);
            return res.status(500).send({message:'Error',data:err})
        }
    }
}