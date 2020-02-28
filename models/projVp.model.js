const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const projectVPSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project"
    },
    calibration: {
      value: {
        type: Number
      },
      unit: {
        type: String
      }
    },
    jsonString: {
      type: String
    },
    levels: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("projVp", projectVPSchema);
