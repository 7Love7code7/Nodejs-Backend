const group = require('../controllers/employeeGroups.controller');
const policy = require('../helper/policy');
const async = require('async');
const uid = require('uid-safe');

module.exports = (openRoutes, apiRoutes) => {

    apiRoutes.route('/listallgroups').get(group.getAllEmplGroups);

    apiRoutes.route('/getgroup/:id').get(group.getgroupById);

    apiRoutes.route('/addemployeegroup').post(group.saveGroup);

    // apiRoutes.route('/updategroup/:id').put(group.updateGroup);

    //apiRoutes.route('/deletegroup/:id').delete(group.deleteGroup);

};