const request = require("request");
const Ocr = require("../models/ocrtemplate.model");
const mongoose = require("mongoose");
const __ = require("../helper/globals");
const _ = require("lodash");

module.exports = {
    createTamplate: async(req,res)=>{
        console.log("create template",req.body);
        try{
            let user = req.user;
            let template={};
            template.field= req.body.field;
            template.companyId=user.companyId;
            
            let newTag = new Ocr(template);
            console.log("create template",template);
            let tagObj = await newTag.save();
            console.log("created",tagObj);
            return res.json({
                messase:"saved successfully",
                uuid:tagObj._id,
                data:tagObj.field
              });
        }catch(e){
            return res.status(500).json({
                message: "Internal server error",
                data:e
              });
        }
    },

    getTemplates:async(req,res)=>{
        try {
            let templateCount = await Ocr.count({
              companyId: req.user.companyId
            });
      
            let templateList = await Ocr.find({})
              .where({
                companyId: req.user.companyId
              })
              .lean();
      
            return res.json({
              total: templateCount,
              list: templateList
            });
          } catch (e) {
            console.log(e);
            return res.status(500).json({
              message: "Internal server error"
            });
          }
    },

    updateTemplate:async(req,res)=>{
        try{
            let id = req.params.id;
            
            let template=await Ocr.findById({_id:id});

            for(var obj in template.field){
              console.log(obj ,"-",template.field[obj]);
              for(var innobj in req.body.field){
                console.log("in for",obj,"innobj:",innobj);
                if(obj==innobj){
                  console.log("in if",obj,"=",innobj);
                   template.field[obj]=req.body.field[innobj];
                   console.log("update: ", template.field);
                 }else{
                   console.log("else",innobj);
                   var stringObj=innobj;
                   let strObj={};
                   var key3 = innobj;
                   var value3 = req.body.field[innobj];
                   strObj[ key3 ] = value3;
                   console.log("Object created",stringObj);
                   Object.assign(template.field, strObj);
                  
                 }
                
              }
              console.log("update: ", template.field);
            }

           
            await Ocr.update(
                {
                  "_id": req.params.id
                },
                {
                  $set: {
                    "field":  template.field
                  }
                }
              );
              return res.status(200).json({
                messase:"updated successfully",
                uuid:template._id,
                data:template.field
            });
            
        }catch(e){
            return res.status(500).json({
                message: "Internal server error",
                data:e
              });
        }
    },

    deleteTemplate:async(req,res)=>{
    
        let id = req.params.id;

        if (!id) {
            return res.status(400).json({
                message: " requested Employee ID is missing"
            })
        }
        try {

            let updatedocr = await Ocr.findByIdAndRemove({
                _id: id
            })

            /* Save all changes */
            await updatedocr.save();

            return res.status(200).json({
                message: "Template deleted successfully"
            })
      }catch(e){
            return res.status(500).json({
                message: "Internal server error",
                data:e
              });
    }
  },

  deleteField:async(req,res)=>{
    try{
      let id = req.params.id;
      let template=await Ocr.findById({_id:id});
      if(template){
        for(var obj in template.field){
          console.log("obj",obj);
          if(req.body.field == obj){
            delete template.field[obj];
          }else{
            console.log("no match");
          }
        }

        await Ocr.update(
         {
           "_id": req.params.id
         },
         {
           $set: {
             "field":  template.field
           }
         }
       );
       return res.status(200).json({
         messase:"field deleted successfully",
         uuid:template._id,
         data:template.field
     });
    }else{
      return res.status(404).json({
        message: "This OCR template does not exists",
        data:e
      });
    }
   
    }catch(e){
      return res.status(500).json({
          message: "Internal server error",
          data:e
        });
      }
  }
};