"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var BillingSchema = new Schema(
  {
    systemTag: {
      type: String
    },
    bill: { type: Schema.Types.ObjectId, ref: "Asset" },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" },
    companyId: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    billDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    billNo: {
      type: String
    },
    billType: {
      type: String
    },
    amountWithoutTax: { type: Number },
    taxAmount: { type: Number },
    totalAmount: { type: Number },
    approval: { type: Boolean, default: true },
    approver: [{ type: Schema.Types.ObjectId, ref: "User" }],
    active: { type: Boolean, default: true },
    approvalStatus: {
      type: String,
      enum: ["approved", "unapproved"],
      default: "unapproved"
    },
    customSupplierData: {},
    thumbnail: {
      type: String
    },
    paymentStatus: { type: String, enum: ["paid", "unpaid"], default: "unpaid" }
  },
  { timestamps: true }
);

BillingSchema.pre("save", next => {
  console.log(this);
  next();
});

module.exports = mongoose.model("Billing", BillingSchema);
