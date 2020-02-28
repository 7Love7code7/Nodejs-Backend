'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * GPS tracking Schema
*/

var GpsTrackingSchema = new Schema({
    rooferId : {
        type : Schema.Types.ObjectId, ref : 'User'
    },
    rooferName : {
        type: String
    },
    companyId : {
        type : Schema.Types.ObjectId, ref : 'Company'
    },
    entryTime : {
        type: Date
    },
    exitTime : {
        type: Date
    },
    projectId : {
        type : Schema.Types.ObjectId, ref : 'Project'
	},
	projectName : {
		type: String
	},
	address: {
		line1: {
			type: String
		},
		line2: {
			type: String
		},
		line3: {
			type: String
		},
		city: {
			type: String
		},
		countryCode: {
			type: String
		},
		postalCode: {
			type: String
		},
		loc: {
			'type': {
				type: String,
				default: "Point"
			},
			coordinates:
			{
				type: [Number],
				default: [0, 0]
			}
		}
	}
});

/*
    Hook a pre save method
*/
GpsTrackingSchema.pre("save", (next) => {
	
		console.log(this)
		next();
	});

/*
    Hook validations for saving data
*/

module.exports = mongoose.model('GpsTracking', GpsTrackingSchema);