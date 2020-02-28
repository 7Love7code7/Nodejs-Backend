const taskProgress   = require('../controllers/taskProgress.controller')
const policy    = require('../helper/policy');

module.exports  = (openRoutes,apiRoutes) =>  {

    apiRoutes.route('/createTaskProgressForProject/:p_id')
        .post(taskProgress.createTaskProgressForProject)        // TODO : create taskProgress

    apiRoutes.route('/listAllTaskProgresss')
        .get(taskProgress.listAllTaskProgresss)       // TODO : list all taskProgress  

    apiRoutes.route('/getTaskProgressById/:t_id')
        .get(taskProgress.getTaskProgressById)        // TODO : Get 1 taskProgress by id

    apiRoutes.route('/listTaskProgressByProjectId/:p_id')
        .get(taskProgress.listTaskProgressByProjectId)        // TODO : Get 1 taskProgress by id
    
    apiRoutes.route('/listTaskProgressByRooferId/:r_id')
        .get(taskProgress.listTaskProgressByRooferId)        // TODO : Get 1 taskProgress by id        

    apiRoutes.route('/updateTaskProgressById/:t_id').all(policy.isManager)
        .put(taskProgress.updateTaskProgressById)     // TODO : update 1 taskProgress by id     
}