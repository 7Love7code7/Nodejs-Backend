const rooferConcern   = require('../controllers/rooferConcern.controller')
const policy    = require('../helper/policy');

module.exports  = (openRoutes,apiRoutes) =>  {

    apiRoutes.route('/createRooferConcern')
        .post(rooferConcern.createRooferConcern)        //creates a rooferConcern

    apiRoutes.route('/listAllRooferConcerns').all(policy.isManager)
        .get(rooferConcern.listAllRooferConcerns)       //lists all rooferConcerns

    apiRoutes.route('/listAllRooferConcernsForRoofer')
        .get(rooferConcern.listAllRooferConcernsForRoofer)        //Get rooferConcern of current roofer

    // apiRoutes.route('/deleteRooferConcernById/:h_id')
    //     .delete(rooferConcern.deleteRooferConcernById)

    // apiRoutes.route('/createBulkRooferConcern')
    //     .post(rooferConcern.createBulkRooferConcern)    

}