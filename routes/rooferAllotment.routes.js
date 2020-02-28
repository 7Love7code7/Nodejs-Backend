const rooferAllotment   = require('../controllers/rooferAllotment.controller')
const policy            = require('../helper/policy');

module.exports  = (openRoutes,apiRoutes) =>  {

    apiRoutes.route('/createRooferAllotment').all(policy.isManager)
        .post(rooferAllotment.createRooferAllotment)                    //creates a rooferAllotment

    apiRoutes.route('/updateRooferAllotmentById/:ra_id').all(policy.isManager)
        .put(rooferAllotment.updateRooferAllotmentById)                //update rooferAllotment with Id

    apiRoutes.route('/listAllRooferAllotmentsByRooferId/:r_id')
        .get(rooferAllotment.listAllRooferAllotmentsByRooferId)         //lists all rooferAllotments of a roofer

    apiRoutes.route('/listAllRooferAllotmentsByProjectId/:p_id')
        .get(rooferAllotment.listAllRooferAllotmentsByProjectId)        //lists all rooferAllotments of a project  
    
    apiRoutes.route('/getRooferAllotmentById/:ra_id')                   //get 1 rooferAllotment by id
        .get(rooferAllotment.getRooferAllotmentById)

    apiRoutes.route('/deleteRooferAllotmentById/:ra_id')                   //delete 1 rooferAllotment by id
        .delete(rooferAllotment.deleteRooferAllotmentById)
        
    apiRoutes.route("/listProjectByAllotment")
        .get(rooferAllotment.listProjectByAllotment)
    
}