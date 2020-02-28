const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const proj2dSchema = new Schema(
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

module.exports = mongoose.model("proj2d", proj2dSchema);
