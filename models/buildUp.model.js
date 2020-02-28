"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * BuildUp Schema
 */

var BuildUpSchema = new Schema({
  projectId: {
    type: String
  },
  companyId: {
    type: String
  },
  asset: {},
  fileName: {
    type: String
  },
  zoomlevel: {
    type: Number
  },
  calibration: {
    points: [
      {
        x: {
          type: Number
        },
        y: {
          type: Number
        }
      }
    ],
    userInputedLength: {
      type: Number
    },
    pixelDistance: {
      type: Number
    }
  },
  raItem: {},
  startLocation: {
    x: {
      type: Number
    },
    y: {
      type: Number
    }
  },
  area: {
    type: Number
  },
  totalCost: {
    currencyCode: {
      type: String
    },
    value: {
      type: Number
    }
  },
  shapeType: {
    type: String,
    enum: ["point", "circle", "line", "polygon"]
  },
  listOfPoints: {
    type: [
      {
        x: {
          type: Number
        },
        y: {
          type: Number
        }
      }
    ]
  },
  listOfValues: {
    type: []
  },
  providerData: {},
  isActive: {
    type: Boolean,
    default: true
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  }
});

/**
 * Hook a pre save method
 */

BuildUpSchema.pre("save", next => {
  console.log(this);
  next();
});

/**
 * Hook validations for saving data
 */
let validateName = name => {
  //check for invalid names
  return /^[a-zA-Z ]{3,}$/.test(name);
};

module.exports = mongoose.model("BuildUp", BuildUpSchema);
