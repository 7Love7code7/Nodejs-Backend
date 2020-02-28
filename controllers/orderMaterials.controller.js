const Materialorder = require("../models/orderMaterials.model");
const Equipmentorder = require("../models/orderEquipments.model");

module.exports = {
    getOrders:async(req,res)=>{
        res.send("get");
    },

    createMaterialOrder:async(req,res)=>{
    try{
        let order = req.body;
        let user= req.user.displayName;
        order.createdBy = user;
        Materialorder(order).save((err, order) => {
            if (err) {
              console.log(err);
              return res.status(500).json({
                err: 500,
                message: err.message
              });
            } else {
              console.log(order);
              return res.json(order);
            }
          });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  createEquipmentOrder:async(req,res)=>{
    try{
        let order = req.body;
        let user= req.user.displayName;
        order.createdBy = user;
        Equipmentorder(order).save((err, order) => {
            if (err) {
              console.log(err);
              return res.status(500).json({
                err: 500,
                message: err.message
              });
            } else {
              console.log(order);
              return res.json(order);
            }
          });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};

