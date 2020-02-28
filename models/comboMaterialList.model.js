"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const comboMaterialListSchema = new Schema({
  type: {
    type: Number, // 1 - Material , 2 - Equipment
    required: true
  },
  materialId: {
    type: Schema.Types.ObjectId,
    ref: "Material"
  },
  equipmentId: {
    type: Schema.Types.ObjectId,
    ref: "Equipment"
  },
  quantity: {
    type: Number
  },
  priceAdditions: {},
  percentageAdditions: [
    {
      percentageType: {
        type: String
      },
      value: {
        type: Number
      }
    }
  ]
});

module.exports = mongoose.model("ComboMaterialList", comboMaterialListSchema);
