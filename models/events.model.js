"use strict";

const mongoose = require("mongoose"),
      Schema = mongoose.Schema;

/**
 * User Schema
 */

const eventSchema = new Schema(
  {
    name: {
      type: String
    },
    agenda: {
      type: String
    }, 
    userId: {
      type : Schema.Types.ObjectId, 
      ref : 'User'
    },
    location: {
      coordinates:[],
      address:''
    },
    listAssets: [{
      type : Schema.Types.ObjectId, 
      ref : 'Asset'
    }],
    date:{
      type:Date
    },
    listMembers:[{
      type : Schema.Types.ObjectId, 
      ref : 'User'
    }],
   /*  time:{
      type:String
    } */
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
