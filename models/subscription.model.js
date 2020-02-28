var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var SubscriptionsSchema = new Schema(
  {
    email: {
      type: String,
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Subscription", SubscriptionsSchema);
