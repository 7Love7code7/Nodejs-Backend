"use strict";

var mongoose = require("mongoose");
var deepPopulate = require("mongoose-deep-populate")(mongoose);
var Schema = mongoose.Schema;

/**
 * Hierarchy Schema
 */

var testtt = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: "testtt"
      }
    ],

    /**
     * 0 - Admin
     * 1 - Manager
     * 2 - Sub-Contractor
     * 3 - Team Leader
     * 4 - Worker
     *
     */
    access: {
      read: {
        type: Number,
        default: 3
      },
      edit: {
        type: Number,
        default: 3
      },
      delete: {
        type: Number,
        default: 1
      }
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

function autoPopulateSubs(next) {
  this.populate("children");
  next();
}

testtt.pre("find", autoPopulateSubs);

module.exports = mongoose.model("testtt", testtt);
