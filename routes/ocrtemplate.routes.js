const template = require("../controllers/ocrtemplate.controller");
const policy = require("../helper/policy");
const uid = require('uid-safe');
const async = require('async');

module.exports = (openRoutes, apiRoutes) => {
    apiRoutes.route('/createtamplate').post(template.createTamplate);
    apiRoutes.route('/getalltamplates').get(template.getTemplates);
    apiRoutes.route('/updatetamplates/:id').put(template.updateTemplate);
    apiRoutes.route('/removetemplate/:id').delete(template.deleteTemplate);
    apiRoutes.route('/removefield/:id').put(template.deleteField);
}