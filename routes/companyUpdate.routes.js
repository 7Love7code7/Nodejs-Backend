const companyUpdate   = require('../controllers/companyUpdate.controller')
const policy    = require('../helper/policy');

module.exports  = (openRoutes,apiRoutes) =>  {

    apiRoutes.route('/createCompanyUpdate').all(policy.isManager)
        .post(companyUpdate.createCompanyUpdate)        //creates a companyUpdate

    apiRoutes.route('/listAllCompanyUpdates').all(policy.isManager)
        .get(companyUpdate.listAllCompanyUpdates)       //lists all companyUpdates

    apiRoutes.route('/listAllCompanyUpdatesForRoofer')
        .get(companyUpdate.listAllCompanyUpdatesForRoofer)        //Get 1 companyUpdate for roofer

     apiRoutes.route('/getCompanyUpdateById/:h_id').all(policy.isManager)
        .get(companyUpdate.getCompanyUpdateById)

    // apiRoutes.route('/deleteCompanyUpdateById/:h_id')
    //     .delete(companyUpdate.deleteCompanyUpdateById)

    // apiRoutes.route('/createBulkCompanyUpdate')
    //     .post(companyUpdate.createBulkCompanyUpdate)    

}