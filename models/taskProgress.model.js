'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * TaskProgress Schema
 */

var TaskProgressSchema = new Schema({
	projectId : {
		type : String,
		required : "projectId not found"
	},
	taskProgressDescription: {
		type: String,
		default: ''
	},
	taskId : {
		type : String,
		required : "Task Id not found"
	},
	taskTitle : {
		type : String,
		default : "untitled"
	},
	taskDescription : {
		type : String,
		default : "No Description"
	},
    companyId : {
        type : String,
		required : "companyId not found"
    },
	rooferId : {
		type : String,
		required : "rooferId not found"
	},
	date : {
		type : Date,
		required : "date not found"
	},
    buildUpId : {
        type : String
    },
    assetsList : {
        type : []
    },
	providerData: {},
	isActive : {
			type : Boolean
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

TaskProgressSchema.pre("save", (next) => {

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

let validateToken = (token) => {
    //validate token
    return true
}


module.exports = mongoose.model('TaskProgress', TaskProgressSchema);