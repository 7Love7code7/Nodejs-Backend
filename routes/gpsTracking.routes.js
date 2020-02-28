const gpsTrackingController = require('../controllers/gpsTracking.controller')
const policy = require('../helper/policy');

module.exports = (openRoutes, apiRoutes) => {

    apiRoutes.route('/createGpsTracking').all(policy.isManager)
        .post(gpsTrackingController.create)

    apiRoutes.route('/readGpsTracking').all(policy.isManager)
        .post(gpsTrackingController.read)
}