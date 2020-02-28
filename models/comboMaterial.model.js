"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Rate analysis Schema
 */

var comboMaterialSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      Ref: "Company"
    },
    comboMaterialList: [
      {
        type: Schema.Types.ObjectId,
        ref: "ComboMaterialList"
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    systemTag: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      default: ""
    },
    unit: {
      type: String,
      required: true
      //enum: ["mt", "sq.mt", "cu.mt", "ft", "sq.ft", "cu.ft", "unit"]
    },
    files: {
      images: [
        {
          type: Schema.Types.ObjectId,
          ref: "Asset"
        }
      ],
      docs: [
        {
          type: Schema.Types.ObjectId,
          ref: "Asset"
        }
      ]
    },
    customMaterialList: [
      {
        name: { type: String },
        rooferCost: { type: Number },
        materialCost: { type: Number },
        quantity: { type: Number }
      }
    ],
    providerData: {},
    hexHtmlColourCode: {
      type: String
    }
  },
  {
    timestamps: true,
    usePushEach: true
  }
);

module.exports = mongoose.model("ComboMaterial", comboMaterialSchema);
