const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const timelineTaskSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project"
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company"
    },
    taskMeta: {},

    /* Gantt Objects */
    text: { type: String, default: "untitled" },
    type: {
      type: String,
      default: "task"
    },
    progress: { type: Number, default: 0 },
    open: { type: Boolean, default: true },
    start_date: { type: String },
    duration: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: "TimelineTask" },
    root: {
      type: Schema.Types.ObjectId,
      ref: "TimelineTask"
    },
    summaryTask: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimelineTask", timelineTaskSchema);
