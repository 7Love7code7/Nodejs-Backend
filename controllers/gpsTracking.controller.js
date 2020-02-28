const GpsTracking  = require('../models/gpstracking.model');
const _ = require('lodash');

module.exports = {

    create   : async (req,res) => {
        try {
            let doc = req.body.data;
            /* required fields validation */

            /* end of required fields validation */

            let insertedDocs =  await GpsTracking.insertMany(doc);

            return res.status(200).json({
                message : 'Tracking data added successfully',
                data : insertedDocs
            });
        }
        catch(e) {
            console.log(e);
            return res.status(500).json({
                message : 'Internal server error'
            });
        }
    },
    read : async (req , res) => {
        try {
            let findOrfindOne;
            if(req.body.trackingId) {
                findOrfindOne = GpsTracking.findOne({_id : req.body.trackingId , companyId : req.user.companyId});
            } else {
                findOrfindOne = GpsTracking.find({companyId : req.user.companyId});
            }

            let gpsTrackingData = await findOrfindOne.lean();

            return res.status(200).json({
                message : 'Tracking data loaded successfully',
                data : gpsTrackingData
            });
        }
        catch(e) {
            return res.status(500).json({
                message : 'Internal server error'
            });
        }
    }

   
}