const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const roleSchema = new Schema(
  {
    roleName: {
      type: String,
      required: true
    },
    nodeId: {
      type: String
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company"
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role"
      }
    ],
    status: {
      type: Number,
      enum: [1, 2, 3], // 1 - active, 2 - inactive, 3 - delted,
      default: 1
    }
  },

  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
