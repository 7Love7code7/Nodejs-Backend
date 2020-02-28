"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Company Schema
 */

const privileges = new Schema({
  /**
   * 0 - Admin
   * 1 - Manager
   * 2 - Sub-Contractor
   * 3 - Team Leader
   * 4 - Worker
   *
   */
  company: {
    currency: {
      type: Number,
      default: 0
    },
    language: {
      type: Number,
      default: 0
    }
  },
  userManagement: {
    manager: {
      type: Number,
      default: 0
    },
    subContractor: {
      type: Number,
      default: 1
    },
    teamLeader: {
      type: Number,
      default: 2
    },
    worker: {
      type: Number,
      default: 3
    }
  },
  project: {
    createProject: {
      type: Number,
      default: 1
    },
    createPlan: {
      type: Number,
      default: 1
    },
    createInvoice: {
      type: Number,
      default: 1
    },
    processBill: {
      type: Number,
      default: 1
    },
    createTodo: {
      type: Number,
      default: 1
    },
    createCalendarEvents: {
      type: Number,
      default: 1
    },
    createIssues: {
      type: Number,
      default: 1
    },
    createReports: {
      type: Number,
      default: 1
    },
    createMeetingRooms: {
      type: Number,
      default: 1
    },
    createClients: {
      type: Number,
      default: 0
    },
    createOffer: {
      type: Number,
      default: 0
    }
  },
  fileManager: {
    basicAccess: {
      type: Number,
      default: 3
    }
  }
});

var CompanySchema = new Schema({
  companyName: {
    type: String,
    trim: true,
    default: ""
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
  companyWebsite: {
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
  companyContact: {
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
  address1: {
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
  },
  address2: {
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
  companyAdmin: {
    type: String
  },
  companyManagers: {
    type: [
      {
        type: String
      }
    ]
  },
  companyRoofers: {
    type: [
      {
        type: String
      }
    ]
  },
  companyLogo: {
    type: String
    //default: "https://res.cloudinary.com/dktnhmsjx/image/upload/v1486129234/default/company.png"
  },
  provider: {
    type: String
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
  },
  clients: {
    type: [
      {
        type: String
      }
    ]
  },
  materials: {
    type: [
      {
        type: String
      }
    ]
  },
  holidays: {
    type: [
      {
        type: String
      }
    ]
  },
  currencyLog: [
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
  language: {
    type: String,
    default: ""
  },
  dashboardSettings: {},
  privileges: privileges,

  economicSettings: {
    termsAndConditions: {
      type: "String"
    },
    billApprovalAdmin: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    billAutoAggregation: {
      email: {
        type: String
      },
      subjectLineCode: {
        type: String
      }
    },
    paymentInfo: [
      {
        accountNumber: { type: String },
        holderName: { type: String },
        ibanNumber: { type: String },
        bankName: { type: String },
        bankAddress: { type: String },
        bankSortCode: { type: String },
        routingNumber: { type: String },
        swiftCode: { type: String },
        ifscCode: { type: String },
        bankroutingCode: { type: String },
        isDefault: { type: Boolean },
        companyId: { type: String }
      }
    ]
  },
  location: {
    type: {
      type: String,
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  billApprovers: [
    {
      approver: { type: Schema.Types.ObjectId, ref: "User" },
      limit: {
        type: Number
      }
    }
  ],
  billTypes: {
    type: [
      {
        type: String
      }
    ],
    default: ["sales", "inventory"]
  },
  paymentConditions: [
    {
      from: {
        type: Number
      },
      to: {
        type: Number
      },
      percentage: {
        type: Number
      }
    }
  ],
  averageWorkerCost: {
    type: Number,
    default: 0
  },
  companyCost: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  companyEmployee: {
    type: [
      {
        type: String
      }
    ]
  },
  companyInputMethod: {
    type: String,
    default: "British/American et al."
  },
  employee: {
    type: Object,
    salaryType: {
      type: String,
      enum: ["Per Hour", "Per Week", "Per Month", "Per Year", "Fixed Amount", "Other"]
    },
    pension: {
      SalaryComponent: Number,
      CompanyPaid: Number
    },
    bonus: {
      AmountPerSalaryType: {
        currencyCode: {
          type: String,
          default: "DKK"
        },
        amount: {
          type: Number
        }
      },
      taskList: []
    },
    workingHours: {
      days: {
        from: {
          type: String,
          default: "Monday"
        },
        to: {
          type: String,
          default: "Saturday"
        }
      },
      time: {
        from: String,
        to: String
      }
    },
    overtime: [{ hours: Number, percent: Number }],
    weekendPay: {
      satListHourVsOt: [{ hours: Number, percent: Number }],
      sunListHourVsOt: [{ hours: Number, percent: Number }]
    },
    CarCosts: {
      amount: Number,
      currency: {
        type: String,
        default: "DKK"
      },
      DistanceUnit: {
        type: String,
        enum: ["km", "mile", "foot", "m"]
      },
      remark: String
    }
  },
  controlPlans: [],
  roleTree: []
});

/**
 * Hook a pre save method
 */

CompanySchema.pre("save", next => {
  console.log("saving Company");
  next();
});

CompanySchema.pre("update", next => {
  console.log("updating Company");
  next();
});

/**
 * Hook validations for saving data
 */
let validateName = name => {
  //check for invalid names
  return /^[a-zA-Z ]{3,}$/.test(name);
};

module.exports = mongoose.model("Company", CompanySchema);
