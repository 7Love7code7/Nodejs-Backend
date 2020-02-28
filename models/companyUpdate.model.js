'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Material Schema
 */

var CompanyUpdateSchema = new Schema({
	
    action : {
        type : {
            intent : {
                type : String
            },
            extra  : {}
        },
        required : true
    },
    recipientList : {
        type : [{
            name : {
                type : String
            },
            rooferId : {
                type : String
            },
            profilePic : {
                type : String
            }  
        }]
    },
    date : {
        type : Date,
        default : Date.now
    },
    companyId : {
        type : String
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

CompanyUpdateSchema.pre("save", (next) => {
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



module.exports = mongoose.model('CompanyUpdate', CompanyUpdateSchema);