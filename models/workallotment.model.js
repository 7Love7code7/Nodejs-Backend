'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Task Schema
 */

var workAllotmentSchema = new Schema({
    workername:{
        type:String
    },
    listUsers:[{
        type : Schema.Types.ObjectId, 
        ref : 'User'
    }],
    listAvailability: [
        {startDate:Date, endDate:Date}
    ], 
    location:{
        coordinate:{},
        name:''
    },
    
    companyId:{
        type : Schema.Types.ObjectId, 
        ref : 'Company'
    },
    created: {
		type: Date,
		default: Date.now
	}
});
module.exports = mongoose.model("WorkAllotment", workAllotmentSchema);