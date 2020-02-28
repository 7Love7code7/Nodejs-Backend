"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Material Schema
 */

var MaterialSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    companyId: {
      type: String,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    orderingUnit: {
      unit: {
        type: String
      },
      orderingDenomination: {
        name: {
          type: String
        },
        quantity: {
          type: Number
        },
        description: {
          type: String
        }
      }
    },
    type: {
      type: String
    },
    rateLog: [
      {
        date: {
          type: Date
        },
        materialCost: {
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
      materialCost: {
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
      },
      supplier: {
        type: Schema.Types.ObjectId,
        ref: "Supplier"
      }
    },
    cost: [
      {
        materialCost: {
          currencyCode: {
            type: String
          },
          value: {
            type: Number
          }
        },
        supplierCost: {
          type: Number
        },
        supplier: {
          type: Schema.Types.ObjectId,
          ref: "Supplier"
        },
        materialSerialNumber: {
          type: String
        },
        date: { type: Date },
        isDefault: {
          type: Boolean,
          default: false
        }
      }
    ],
    wastePercentage: {
      type: Number
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
    suppliers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Supplier"
      }
    ],
    maintenancePeriod: {
      type: Number,
      default: 90
    },
    numPiecesInPackage : {
      type: Number,
      default: 0
    },
    hexHtmlColourCode : {
      type: String
    },
    dimensions: {
      unit: {
        length: Number,
        width: Number,
        height: Number
      }
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

MaterialSchema.pre("save", next => {
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

module.exports = mongoose.model("Material", MaterialSchema);
