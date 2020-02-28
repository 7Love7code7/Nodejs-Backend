const task   = require('../controllers/task.controller')
const policy    = require('../helper/policy');

module.exports  = (openRoutes,apiRoutes) =>  {

    apiRoutes.route('/createTaskForProject/:p_id').all(policy.isManager)
        .post(task.createTaskForProject)        // TODO : create task

    apiRoutes.route('/listAllTasks')
        .get(task.listAllTasks)       // TODO : list all task  

    apiRoutes.route('/getTaskById/:t_id')
        .get(task.getTaskById)        // TODO : Get 1 task by id

    apiRoutes.route('/listTaskByProjectId/:p_id')
        .get(task.listTaskByProjectId)        // TODO : Get 1 task by id    

    apiRoutes.route('/updateTaskById/:t_id').all(policy.isManager)
        .put(task.updateTaskById)     // TODO : update 1 task by id

    apiRoutes.route('/deleteTaskById/:t_id').all(policy.isManager)
        .delete(task.deleteTaskById)     // TODO : update 1 task by id          
}