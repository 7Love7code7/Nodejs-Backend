var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var SuppliersSchema = new Schema({
  systemTag: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  contact: {
    dialCode: {
      type: String
    },
    phoneNumber: {
      type: String
    }
  },
  email: {
    type: String,
    trim: true,
    default: "",
    match: [/.+\@.+\..+/, "Please fill a valid email address"]
  },
  address: {
    type: String
  },
  profilePic: {
    type: String
    // default: "https://res.cloudinary.com/dktnhmsjx/image/upload/v1486128885/default/roofer.png"
  },
  supplies: [
    {
      type: Schema.Types.ObjectId,
      ref: "Material"
    }
  ],
  staff: {
    type: [
      {
        name: String,
        contact: {
          dialCode: {
            type: String
          },
          phoneNumber: {
            type: String
          }
        },
        email: String
      }
    ]
  },

  bankDetails: [
    {
      accountHolderName: String,
      accountNumber: String,
      IBAN: String,
      bankName: String,
      bankAddress: String,
      sortCode: String,
      routingNo: String,
      bicCode: String,
      ifscCode: String,
      routingCode: String
    }
  ],
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },
  assetId: {
    type: Schema.Types.ObjectId,
    ref: "Asset"
  },
  created: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String
  },
  paymentConditions: [
    {
      from: {
        type: Number
      },
      to: {
        type: Number
      },
      percentage: {
        type: Number
      }
    }
  ],
  vat: {
    type: Number
  }
});

module.exports = mongoose.model("Supplier", SuppliersSchema);
