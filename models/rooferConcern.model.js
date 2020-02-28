'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Material Schema
 */

var RooferConcernSchema = new Schema({
	
    concernType : {
        type : String,
        required : true
    },
    optionSelected : {
        type : [{
            type : String,
        }]
    },
    date : {
        type : Date,
        default : Date.now
    },
    creatorId : {
        type: Schema.Types.ObjectId, ref: 'User' 
    },
    companyId : {
        type : String
    },
    projectId : {
        type: Schema.Types.ObjectId, ref: 'Project' 
    },
    assetsList : {
        type : []
    },
	message : {
			type : String
	},
    description : {
			type : String
	},
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

RooferConcernSchema.pre("save", (next) => {
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



module.exports = mongoose.model('RooferConcern', RooferConcernSchema);