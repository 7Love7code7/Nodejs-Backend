'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Company Schema
 */

var datesAllotmentSchema = new Schema({
    date:Date,
    workAllotmentId:{
        type : Schema.Types.ObjectId, 
        ref : 'WorkAllotment'
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
module.exports = mongoose.model("DateAllotment", datesAllotmentSchema);
