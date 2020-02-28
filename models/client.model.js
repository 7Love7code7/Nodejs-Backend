"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Company Schema
 */

var ClientSchema = new Schema({
  clientName: {
    type: String,
    trim: true,
    default: ""
  },
  companyId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  yearFounded: {
    type: String,
    trim: true,
    default: ""
  },
  clientWebsite: {
    type: String,
    default: ""
  },
  industry: {
    type: [
      {
        type: String
      }
    ]
  },
  clientContact: {
    dialCode: {
      type: String
    },
    phoneNumber: {
      type: String
    }
  },
  email: {
    type: String
  },
  address: [
    {
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
      postalCode: {
        type: String
      },
      countryCode: {
        type: String
      },
      loc: {
        type: {
          type: String,
          enum: "Point",
          default: "Point"
        },
        coordinates: {
          type: [Number],
          default: [0, 0]
        }
      }
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
  },
  annualRevenue: {
    currencyCode: {
      type: String
    },
    value: {
      type: String
    }
  },
  linkedinPage: {
    type: String
  },
  twitterHandle: {
    type: String
  },
  facebookPage: {
    type: String
  },
  clientContactPerson: {
    firstName: {
      type: String
    },
    middleName: {
      type: String
    },
    lastName: {
      type: String
    },
    email: {
      type: String
    },
    mobile: {
      dialCode: {
        type: String
      },
      phoneNumber: {
        type: String
      }
    },
    title: {
      type: String
    }
  },
  clientLogo: {
    type: String
    // default:
    //   "https://res.cloudinary.com/dktnhmsjx/image/upload/v1555476158/default/placeholderImage.png"
  },
  provider: {
    type: String
    //required: 'Provider is required'
  },
  staff: {
    type: [
      {
        firstName: {
          type: String
        },
        lastName: {
          type: String
        },
        email: {
          type: String
        },
        contact: {
          dialCode: {
            type: String
          },
          phoneNumber: {
            type: String
          }
        }
      }
    ]
  },
  providerData: {},
  projects: {
    type: [
      {
        project_id: {
          type: Schema.Types.ObjectId,
          ref: "Project"
        }
      }
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  additionalProvidersData: {},
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

ClientSchema.pre("save", next => {
  console.log("saving Client");
  next();
});

ClientSchema.pre("update", next => {
  console.log("updating Client");
  next();
});

/**
 * Hook validations for saving data
 */
let validateName = name => {
  //check for invalid names
  return /^[a-zA-Z ]{3,}$/.test(name);
};

module.exports = mongoose.model("Client", ClientSchema);
