"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Issues Schema
 */

var IssuesSchema = new Schema({
  systemTag: {
    type: String,
    required: true
  },
  cloudesIssueId: {
    type: String
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  listBuildups: {
    type: Array
  },
  listMarkers: [
    {
      roofPlanId: {
        type: Schema.Types.ObjectId,
        ref: "Plan"
      },
      xpos: {
        type: Number
      },
      ypos: {
        type: Number
      }
    }
  ],
  drawings: [
    {
      type: Schema.Types.ObjectId,
      ref: "Asset"
    }
  ],
  markedImages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Asset"
    }
  ],
  listAssets: {
    images: [
      {
        type: Schema.Types.ObjectId,
        ref: "Asset"
      }
    ],
    docs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Asset"
      }
    ]
  },

  issueCategory: {
    type: String,
    enum: ["Safety", "Quality", "Issue"],
    required: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User"
    //required: true
  },
  issueStatus: {
    type: String,
    enum: ["High Priority", "Medium Priority", "On Hold", "Low Priority", "Completed"]
  },
  completionStatus: {
    type: String,
    enum: ["OPEN", "RESOLVED"]
  },
  rejectIssue:Boolean,
  deadLine: {
    type: Date
  },
  dependencyOn: {
    type: Schema.Types.ObjectId,
    ref: "Issue"
  },
  assignedTo: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],
  comments: [
    {
      comment: String,
      userName: String,
      pic: String,
      addTime: {
        type: Date,
        default: Date.now
      },
      files: {
        images: [
          {
            type: Schema.Types.ObjectId,
            ref: "Asset"
          }
        ],
        docs: [
          {
            type: Schema.Types.ObjectId,
            ref: "Asset"
          }
        ]
      }
    }
  ],
  issueActivity: [
    {
      userName: String,
      pic: String,
      activity: {
        type: String,
        enum: [
          "created_issue",
          "added_comment",
          "uploaded_new_file",
          "edited_issue",
          "reopened_issue",
          "closed_issue",
          "rejected_issue"
        ]
      },
      addedTime: {
        type: Date,
        default: Date.now
      }
    }
  ],

  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String
  }
});
/**
 * Hook a pre save method
 */

/**
 * Hook validations for saving data
 */
let validateName = name => {
  //check for invalid names
  return /^[a-zA-Z ]{3,}$/.test(name);
};

module.exports = mongoose.model("Issue", IssuesSchema);
