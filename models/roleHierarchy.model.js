const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const roleHierarchySchema = new Schema(
  {
    roleName: {
      type: String,
      required: true
    },
    nodeId: {
      type: String
    }
  },

  { timestamps: true }
);

module.exports = mongoose.model("Role", roleHierarchySchema);
