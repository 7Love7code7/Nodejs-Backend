const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const timelineNotificationSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project"
    },
    notificationType: {
      type: Number,
      required: true,
      enum: [1, 2] // 1 - Task modification, compensatory task
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "TimelineTask"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimelineNotification", timelineNotificationSchema);
