"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const quoteSchema = new Schema({
  quoteName: {
    type: String,
    trim: true,
    required: "Please quote name"
  },
  projectName: {
    type: String,
    default: ''
  },
  // company: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Company",
  //   required: true
  // },
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },

  date: {
    type: Date
  },
  validTill: {
    type: Date
  },
  responsiblePerson: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  clients: {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client"
    },
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    companyName: {
      type: String
    },
    location: {
      type: String
    },
    email: {
      type: String
    },
    acceptStatus: {
      type: String,
      enum: ["Accepted", "Declined", "ReEstimation"]
    },
    processingState: {
      type: String,
      enum: ["Created", "Sent"]
    }

  },
  description: {
    type: String
  },
  termsAndConditions: {
    type: String
  },
  quoteDetails: [{
    productId: {
      type: String
    },
    productName: {
      type: String
    },
    productDescription: {
      type: String
    },
    unitQuantity: {
      type: Number
    },
    unitPrice: {
      type: Number
    },
    currency: {
      type: String
    },
    total: {
      type: Number
    }
  }],
  totalNetAmount: {
    type: Number
  },
  totalTaxAmount: {
    type: Number
  },
  quoteTotal: {
    type: Number
  },
  isActive: {
    type: Number,
    default: 1 /* 0 - inactive , 1 - active , 2 - deleted */
  },
  pdfObjectAssign: {
    type: String,
    default: ''
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Quote", quoteSchema);