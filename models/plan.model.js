'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Company Schema
 */

var PlanSchema = new Schema({
	startDate: {
		type: Date
    },
    endDate: {
		type: Date
    },
	projectId: {
				type : Schema.Types.ObjectId, ref : 'Project'
			},
	days : {
		type : [{               //day
                date : { type : Date},
                roofers : [{
                            type : Schema.Types.ObjectId, ref : 'User'
                        }],
                teamLeaders : [{
                            type : Schema.Types.ObjectId, ref : 'User'
                        }],        
                tasks : [{
                        description : {type : String}
                }]
            }]
	},
	providerData: {},
	isActive : {
			type : Boolean,
			default : true
		},
	additionalProvidersData: {},
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

PlanSchema.pre("save", (next) => {

	console.log("saving Plan")
	next();
});

PlanSchema.pre("update", (next) => {

	console.log("updating Plan")
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


module.exports = mongoose.model('Plan', PlanSchema);