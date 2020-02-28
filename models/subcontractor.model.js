var mongoose = require("mongoose"),
  crypto = require("crypto");
Schema = mongoose.Schema;

var SubcontractorSchema = new Schema({
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
    // default:
    //   "https://res.cloudinary.com/dktnhmsjx/image/upload/v1555476158/default/placeholderImage.png"
  },
  attributes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Tag",
      required: true
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
  webToken: {
    type: String
  },
  mobileToken: {
    type: String
  },
  password: {
    type: String
  },
  salt: {
    type: String
  },
  created: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false
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

SubcontractorSchema.methods.getSaltAndPassword = function(newPassword) {
  let salt = crypto.randomBytes(16).toString("base64");
  let password = crypto
    .pbkdf2Sync(newPassword, new Buffer(salt, "base64"), 10000, 64, "SHA1")
    .toString("base64");
  return { salt: salt, password: password };
};

SubcontractorSchema.methods.hashPassword = function(password) {
  if (this.salt && password) {
    return crypto
      .pbkdf2Sync(password, new Buffer(this.salt, "base64"), 10000, 64, "SHA1")
      .toString("base64");
  } else {
    return password;
  }
};

SubcontractorSchema.methods.authenticate = function(password) {
  return this.password === this.hashPassword(password) && this.isActive;
};

module.exports = mongoose.model("Subcontractor", SubcontractorSchema);
