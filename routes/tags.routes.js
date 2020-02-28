const tags = require("../controllers/tags.controller");
const policy = require("../helper/policy");

module.exports = (openRoutes, apiRoutes) => {
   
 
 apiRoutes.route('/createTag').post(tags.createTag);

 apiRoutes.route('/getTagsList').get(tags.getAllTags);

 apiRoutes.route('/deletetag/:id').delete(tags.deleteTag);



}