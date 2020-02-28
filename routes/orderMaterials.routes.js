const materialorder = require("../controllers/orderMaterials.controller");
const entityTag = require("../controllers/entityTag.controller");
const policy = require("../helper/policy");
const uid = require("uid-safe");

module.exports = (openRoutes, apiRoutes) => {
    apiRoutes.route("/getOrder").get(materialorder.getOrders);

    apiRoutes
      .route("/createMaterialOrder")
      .post(materialorder.createMaterialOrder); // TODO : create material

    apiRoutes
      .route("/createEquipmentOrder")
      .post(materialorder.createEquipmentOrder); // TODO : create material
};