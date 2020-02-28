"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const meetingRoomSchema = new Schema({
  name: {
    type: String
  },
  title: {
    type: String
  },
  description: {
    type: String
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "Project"
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  systemTag: {
    type: String
  },
  videoRoomSid: {
    type: String
  },
  date: {
    type: Date
  },
  isActive: {
    type: Number,
    default: 0 /* 0 - inactive , 1 - active , 2 - deleted */
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  users: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("MeetingRoom", meetingRoomSchema);