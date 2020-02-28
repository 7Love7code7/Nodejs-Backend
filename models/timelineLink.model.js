const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const timelineLinkSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project"
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company"
    },
    source: {
      type: Schema.Types.ObjectId,
      ref: "Company"
    },
    target: {
      type: Schema.Types.ObjectId,
      ref: "Company"
    },
    type: {
      type: String,
      default: "0"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimelineLink", timelineLinkSchema);
