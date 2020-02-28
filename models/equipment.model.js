"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Material Schema
 */

var EquipmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    companyId: {
      type: String,
      required: true
    },
    rateLog: [
      {
        date: {
          type: Date
        },
        equipmentCost: {
          currencyCode: {
            type: String
          },
          value: {
            type: Number
          }
        },
        rooferCost: {
          currencyCode: {
            type: String
          },
          value: {
            type: Number
          }
        }
      }
    ],
    currentRate: {
      date: {
        type: Date
      },
      equipmentCost: {
        currencyCode: {
          type: String
        },
        value: {
          type: Number
        }
      },
      rooferCost: {
        currencyCode: {
          type: String
        },
        value: {
          type: Number
        }
      }
    },
    systemTag: {
      type: String,
      required: true
    },
    providerData: {},
    isActive: {
      type: Boolean,
      default: true
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
    workers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    totalCountEq: {
      type: Number
    },
    chargingUnit: {
      type: String
    },
    owned: {
      type: Boolean,
      default: false
    },
    // locationEq:[{
    //   location: {
    //     type: {
    //       type: String,
    //       default: "Point"
    //     },
    //     coordinates: {
    //       type: [Number],
    //       default: [0, 0]
    //     }
    //   },
    //   locationCountEq:{
    //     type:Number
    //   }
    // }]
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
    hexHtmlColourCode: {
      type: String
    },
    oneTimeDelivery: {
      type: Boolean,
      default: false
    },
    deliveryCost: {
      type: Number
    },
    chargeMode: {
      type: String
    }
  },
  {
    timestamps: true,
    usePushEach: true
  }
);

/**
 * Hook a pre save method
 */

EquipmentSchema.pre("save", next => {
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

module.exports = mongoose.model("Equipment", EquipmentSchema);
