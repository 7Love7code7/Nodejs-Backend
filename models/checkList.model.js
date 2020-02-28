"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const checklistSchema = new Schema(
  {
    systemTag: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    checkListItem: [
      {
        titleList: { type: String, required: true },
        descriptionList: { type: String, default: "" },
        statusList: { type: String, enum: ["Yes", "No", "N/A"], default: "No" },
        remarksList: { type: String, default: "" },
        images: [
          {
            type: Schema.Types.ObjectId,
            ref: "Asset"
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("CheckList", checklistSchema);
