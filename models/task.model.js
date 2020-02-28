'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Task Schema
 */

var TaskSchema = new Schema({
	taskName: {
		type: String,
		required : "Please enter task name"
	},
	projectId : {
		type : String,
		required : "projectId not found"
	},
	taskDescription: {
		type: String,
		default: ''
	},
    companyId : {
        type : String,
		required : "companyId not found"
    },
	taskImage : {
		type : String,
		default : "https://res.cloudinary.com/dktnhmsjx/image/upload/v1486129096/default/task.png"
	},
	startDate : {
		type : Date,
		required : "startDate not found"
	},
	endDate : {
		type : Date
	},
	provider: {
		type: String,
	},
	providerData: {},
	taskStatus : {
		type : String
	},
	isActive : {
			type : Boolean,
			default : true
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

TaskSchema.pre("save", (next) => {

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


module.exports = mongoose.model('Task', TaskSchema);