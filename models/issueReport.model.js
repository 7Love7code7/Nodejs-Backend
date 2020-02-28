'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Issues Schema
 */

var IssuesReportSchema = new Schema({
   
    Title:{
        type:String,
        required:true
    },
    preparedFor:{
        type: String
    },
    companyBy:{
        type:String
    },
    aboutus:{
        type:String
    },
    phone:{
        type: Number
    },
    companyName:{
        type: String
    },
    email:{
        type: String,
		trim: true,
		default: '',
		match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    website:{
        type:String
    },
    projectName:{
        type:String
    },
    projectSerialNo:{
        type:String
    },
    Enterprisename:{
        type:String
    },
    remarks:{
        type:[
           {
               title:{
                   type:String
               },
               value:{
                   type:String
               }
           } 
        ]
    },
    remarkAuhorValue:{
        type: String
    },
    remarkDate:{
        type: Date,
		default: Date.now
    },
    updated: {
		type: Date
	},
	created: {
		type: Date,
		default: Date.now
    },
    createdBy: {
		type: String
	}
});
/**
 * Hook a pre save method
 */

IssuesReportSchema.pre("save", (next) => {

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



module.exports = mongoose.model('Issue', IssuesReportSchema);