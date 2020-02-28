"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Issues Schema
 */

var ocrtemplateSchema = new Schema({

    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
    },
    companyId : {
        type: Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    field:{
        type:Object
    }
    

});

module.exports = mongoose.model("octtemplate", ocrtemplateSchema);