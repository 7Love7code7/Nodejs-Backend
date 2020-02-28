const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const timelineHierarchySchema = new Schema(
  {
    calcSheetId: {
      type: Schema.Types.ObjectId,
      ref: "calcSheet"
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project"
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company"
    },
    initialWorkersPerTask: {
      type: Number
    },
    // tasks: [
    //   {
    //     root: {
    //       type: Schema.Types.ObjectId,
    //       ref: "TimelineTask"
    //     },
    //     items: [
    //       {
    //         type: Schema.Types.ObjectId,
    //         ref: "TimelineTask"
    //       }
    //     ]
    //   }
    // ],
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "TimelineTask"
      }
    ],
    links: [
      {
        type: Schema.Types.ObjectId,
        ref: "TimelineLink"
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimelineHierarchy", timelineHierarchySchema);
