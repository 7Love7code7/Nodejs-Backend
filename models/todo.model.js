"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * User Schema
 */

const todoSchema = new Schema({
  title: {
    type: String
  },
  description: {
    type: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  date: {
    type: Date
  },
  time: {
    type: String
  },
  channelUrl: {
    type: String,
    default: ""
  },
  markAsDone: {
    type: Boolean,
    default: false
  },
  meetingRoomId: {
    type: Schema.Types.ObjectId,
    ref: "MeetingRoom"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Todo", todoSchema);