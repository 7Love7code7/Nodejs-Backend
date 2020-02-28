"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

  /**
 * Material Order Schema
 */

var equipmentOrderSchema = new Schema(
    {

        Title:{
            type:String
        },
        equipments:[
            {
                equipment: {
                    type: Schema.Types.ObjectId,
                    ref: "Equipment"
                  },
                quantity: Number
             }
         ],
        projectId:{
            type: Schema.Types.ObjectId,
            ref: "Project"
            
        },
        priority:{
            type: String,
            enum: ["High", "Medium","Low"],
        },
        requiredDate:{
            type:Date
        },
        status:{
            type: String,
            enum: ["complete", "pending"],
        },
        updated: {
            type: Date
        },
        loc: {
            type: {
              type: String,
              default: "Point"
            },
            coordinates: {
              type: [Number],
              default: [0, 0]
            }
        },
        created: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: String
        }

    }
);

module.exports = mongoose.model("EquipmentOrder", equipmentOrderSchema);