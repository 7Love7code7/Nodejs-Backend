"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Invoice Schema
 */

const invoiceSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client"
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company"
    },
    date: {
      type: Date,
      default: Date.now
    },
    invoiceTag: {
      type: String
    },
    invoiceNumber: {
      type: Number
    },
    projectSystemTag: {
      type: String
    },
    termsAndConditions: {
      type: Boolean
    },
    calculatedProcess: {
      type: Boolean
    },
    email: {
      type: String
    },
    items: [
      {
        description: {
          type: String,
          default: ""
        },
        quantity: {
          type: Number,
          default: 1
        },
        unitPrice: {
          type: Number,
          default: 0
        },
        discountPercent: {
          type: Number
        },
        taxRate: {
          type: Number
        },
        sales: {
          type: Number
        }
      }
    ],
    approvalStatus: {
      type: String,
      enum: ["approved", "rejected", "notapproved"],
      default: "notapproved"
    },
    invoiceDoc: {
      type: String
    },
    invoiceStatus: {
      type: String,
      enum: ["paid", "pending"]
    },
    variationOrder: {
      type: Boolean,
      default: false
    },

    creditNote: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      default: null
    },

    paymentTerms: {}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
