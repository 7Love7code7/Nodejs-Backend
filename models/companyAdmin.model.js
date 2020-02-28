'use strict'

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Company Schema
 */


 var CompanyAdmin = new Schema({
     companyId:{
         type: String,
         required : "CompanyId required"
     },
     generatedUuid:{
        type : String,
        required : "UUid not found"
     },
     isActive:{
        type: Boolean,
		default : true
     }
 });

 module.exports = mongoose.model('CompanyAdmin', CompanyAdmin);