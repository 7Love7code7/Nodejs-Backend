"use strict";

var mongoose = require("mongoose"),
  deepPopulate = require("mongoose-deep-populate")(mongoose),
  Schema = mongoose.Schema;

/**
 * Project Schema
 */

var ProjectSchema = new Schema(
  {
    projectName: {
      type: String,
      required: "Please enter project name",
      default: ""
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client"
    },
    projectDescription: {
      type: String,
      default: ""
    },
    companyId: {
      type: String,
      required: "companyId not found"
    },
    projectImage: {
      type: String,
      default: "https://res.cloudinary.com/dktnhmsjx/image/upload/v1486129096/default/project.png"
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    isServiceProject: {
      type: Boolean
      //default: true
    },
    serviceProjectData: {
      date: {
        type: Date
      },
      description: {
        type: String
      },
      assignedTo: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true
        }
      ],
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
      }
    },
    address: {
      line1: {
        type: String
      },
      line2: {
        type: String
      },
      line3: {
        type: String
      },
      city: {
        type: String
      },
      countryCode: {
        type: String
      },
      state:{
        type:String
      },
      postalCode: {
        type: String
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
      }
    },
    provider: {
      type: String
    },

    projectFiles: {
      type: {
        roofPlans: {
          type: [
            {
              assetObj: {}
            }
          ]
        },
        images: {
          type: [
            {
              assetObj: {}
            }
          ]
        },
        others: {
          type: [
            {
              assetObj: {}
            }
          ]
        }
      }
    },
    roofPlans: [
      {
        type: Schema.Types.ObjectId,
        ref: "RoofPlan"
      }
    ],
    providerData: {},
    rooferAllotment: {},
    teamLeaderAllotment: {},
    projectStatus: {
      type: Number,
      default: 0 //0 - offer , 1 - ongoing , 2 - completed
    },
    buildingType: {
      type: String,
      default: ""
    },
    projectRAItems: {
      type: []
    },
    bill: {
      customItems: [],
      raItems: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    calculationDate: {
      type: Date,
      default: Date.now
    },
    projectCurrencyLog: [
      {
        currencyCode: {
          type: String
        },
        conversionFactor: {
          type: Number
        },
        date: {
          type: Date
        }
      }
    ],
    currentCurrency: {
      currencyCode: {
        type: String
      },
      conversionFactor: {
        type: Number
      },
      date: {
        type: Date
      }
    },
    additionalProvidersData: {},
    updated: {
      type: Date
    },
    hierarchies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Hierarchy",
        autopopulate: true
      }
    ],
    backupFolders: [
      {
        name: {
          type: String,
          default: "untitled"
        },
        hierarchies: [
          {
            type: Schema.Types.ObjectId,
            ref: "Hierarchy"
          }
        ],
        date: {
          type: Date,
          default: Date.now
        }
      }
    ],
    calcSheetId: {
      type: Schema.Types.ObjectId,
      ref: "calcSheet"
    },

    baseTemplate: {
      type: Schema.Types.ObjectId,
      ref: "HierarchyTemplate"
    },
    systemTag: {
      type: String,
      required: true
    },
    created: {
      type: Date,
      default: Date.now
    },
    weatherData: {},
    invoiceCount: {
      type: Number,
      default: 1000
    },
    timelineInit: {
      type: Boolean,
      default: false
    },
    timeline: {
      type: Schema.Types.ObjectId,
      ref: "TimelineHierarchy"
    },
    projVp: {
      type: Schema.Types.ObjectId,
      ref: "projVp"
    },
    proj2d: {
      type: Schema.Types.ObjectId,
      ref: "proj2d"
    }
  },
  { timestamps: true }
);

ProjectSchema.plugin(deepPopulate);

/**
 * Hook validations for saving data
 */
let validateName = name => {
  //check for invalid names
  return /^[a-zA-Z ]{3,}$/.test(name);
};

let validateToken = token => {
  //validate token
  return true;
};

ProjectSchema.index({
  address: {
    loc: "2dsphere"
  }
});
module.exports = mongoose.model("Project", ProjectSchema);
