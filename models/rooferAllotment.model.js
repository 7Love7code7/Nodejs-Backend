'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Roofer Allotment Schema
 */

var RooferAllotmentSchema = new Schema({
	rooferId : {
        type : String,
        required : "Roofer Id is required"
    },
    rooferName : {
        type : String,
        required : "Roofer Name is required"
    },
    projectId : {
        // type: String,
        type: Schema.Types.ObjectId, ref: 'Project'
    },
    from : {
        type : Date
    },
    to : {
        type : Date
    },
    companyId : {
        type : String
    },
    isLeader : {
        type : Boolean,
        default : false
    },
    isActve : {
        type : Boolean,
        default : true
    },
    providerData : {},
	updated: {
		type: Date
	},
	created: {
		type: Date,
		default: Date.now
	}
});

/**
 * Hook a pre save method
 */

RooferAllotmentSchema.pre("save", (next) => {
	console.log(this)
	next();
});


/**
 * Hook validations for saving data
 */
let validateName = (name) => {
    //check for invalid names
    return /^[a-zA-Z ]{3,}$/.test(name)
}



module.exports = mongoose.model('RooferAllotment', RooferAllotmentSchema);