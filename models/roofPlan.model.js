"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Roof plan Schema Schema
 */

const associationSchema = new Schema({
  shapeId: {
    type: String
  },
  entityType: {
    type: Number,
    enum: [1, 2, 3] /* 1 - material, 2 - dcp , 3 - Equipment */
  },
  materialId: {
    type: Schema.Types.ObjectId,
    ref: "Material",
    default: null
  },
  comboId: {
    type: Schema.Types.ObjectId,
    ref: "ComboMaterial",
    default: null
  },
  equipmentId: {
    type: Schema.Types.ObjectId,
    ref: "Equipment",
    default: null
  }
});

var roofPlanSchema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "Project"
  },
  assetObj: {
    title: {
      type: String,
      default: "untitled"
    },
    description: {
      type: String,
      default: "unavailable"
    },
    url: {
      type: String,
      required: true
    }

  },
  mimetype: {
    type: String,
    default: ''
  },
  parentAsset: {
    type: Schema.Types.ObjectId,
    ref: "Asset"
  },
  plannerData: {
    initialized: {
      type: Boolean,
      default: false
    },
    jsonString: {
      type: String
    },
    calibration: {
      value: {
        type: Number
      },
      unit: {
        type: String
      }
    },
    shapeAssociation: [associationSchema],
    countData: {}
  },
  status: {
    /* 1 - 'Not Started', 2 - 'In Progress', 3 - 'Completed', 4 - 'Waiting on someone else', 5 - 'Deferred' */
    type: Number,
    enum: [1, 2, 3, 4, 5]
  },
  providerData: {
    name: {
      type: String,
      default: "unavailable"
    }
  },
  isActive: {
    type: Number,
    default: 1 /* 0 - inactive , 1 - active , 2 - deleted */
  },
  model3D: {
    type: String,
  },
  guid: {
    type: String,
  }
}, {
  timestamps: true
});

/**
 * Hook a pre save method
 */

roofPlanSchema.pre("save", next => {
  console.log(this);
  next();
});

module.exports = mongoose.model("RoofPlan", roofPlanSchema);