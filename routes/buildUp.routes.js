const buildUp   = require('../controllers/buildUp.controller')
const policy    = require('../helper/policy');

module.exports  = (openRoutes,apiRoutes) =>  {

    apiRoutes.route('/createBuildUp').all(policy.isManager)
        .post(buildUp.createBuildUp)        // TODO : create buildUp

    apiRoutes.route('/listAllBuildUps')
        .get(buildUp.listAllBuildUps)       // TODO : list all buildUps

    apiRoutes.route('/listBuildUpByAsset/:a_id')
        .get(buildUp.listBuildUpByAsset)       // TODO : list all buildUps for asset id    

    apiRoutes.route('/listAllBuildUpsByProjectId/:p_id')
        .get(buildUp.listAllBuildUpsByProjectId)       // TODO : list all buildUps by a project Id

    apiRoutes.route('/getBuildUpById/:m_id')
        .get(buildUp.getBuildUpById)        // TODO : Get 1 buildUp by id

    apiRoutes.route('/deleteBuildUpById/:h_id').all(policy.isManager)
        .delete(buildUp.deleteBuildUpById)

    apiRoutes.route('/createBulkBuildUp/:p_id').all(policy.isManager)
        .post(buildUp.createBulkBuildUp)    

    apiRoutes.route('/updateBuildUpPic').all(policy.isManager)
        .post(buildUp.updateBuildUpPic)        // TODO : create buildUp img
}