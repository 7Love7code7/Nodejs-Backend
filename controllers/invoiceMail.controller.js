const fs = require('fs');
const notifier = require('mail-notifier');
const uid = require("uid-safe");
const Billing = require("../models/billing.model");
const Asset = require("../models/asset.model");
const User = require("../models/user.model");
const Project = require("../models/project.model");
const entityTagController = require("./entityTag.controller");

var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");

const imap = {
  user: "cloudesdev",
  password: "cloudes123",
  host: "imap.gmail.com",
  port: 993, // imap port
  tls: true,// use secure connection
  tlsOptions: { rejectUnauthorized: false }
};

async function s3upload(mail) {
  
  var path = "out.pdf";
  var file = mail.attachments[0];
  
  var cId = await getCompanyIdByEmail(mail);

  if (!cId) {
    console.log("Not registered user");
    return;
  }

  var pId = await getProjectIdByEmail(mail, cId);

  if (!pId) {
    console.log("No registered projects");
    return;
  }

  var newFile = {
    fieldname: "file",
    originalname: file.fileName,
    bucket: "3dfilesdata/billingFiles",
    key: uid.sync(9) + "_" + file.fileName,
    date: mail.date,
    companyId: cId,
    projectId: pId
  };

  fs.writeFileSync("out.pdf", file.content, 'base64', function(err) {
    console.log(err);
  });


  fs.readFile(path, function (err, data) {
    if (err) throw err; // Something went wrong!
    
    var s3bucket = new AWS.S3({params: {Bucket: newFile.bucket}});
    s3bucket.createBucket(function () {
        var params = {
            Key: newFile.key, //file.name doesn't exist as a property
            Body: data
        };
        s3bucket.upload(params, function (err, uploadedData) {
            // Whether there is an error or not, delete the temp file
            fs.unlink(path, function (err) {
                if (err) {
                    console.error(err);
                }
                console.log('\x1b[32m%s\x1b[0m', 'Temp File Delete');
            });

            if (err) {
                console.log("\x1b[32m%s\x1b[0m", 'ERROR MSG: ', err);
            } else {
                console.log("\x1b[32m%s\x1b[0m", 'Successfully uploaded data');
                newFile.data = uploadedData;
                createNewBillingFromEmail(newFile);
            }
        });
    });
  });
}

const createNewBillingFromEmail = async (file) => {
  var newFile = {
    // "encoding":"7bit",
    // "mimetype":"application/pdf",
    // "size":46122,
    // "acl":"private",
    // "contentType":"application/pdf",
    // "contentDisposition":null,
    // "storageClass":"STANDARD",
    // "serverSideEncryption":null,
    // "metadata":null,
    // "etag":"\"de7576609591c891e954d5dc2b6c42b8\"",
    fieldname: file.fieldname,
    originalname: file.originalname,
    bucket: file.bucket,
    key: file.key,
    secure_url: file.data.Location,
    url: file.data.Location,
    location: file.data.Location,
  }

  let newBill = new Asset(newFile);
  newBill = await newBill.save();

  var billingData = {};

  billingData.billDate = file.date;
  billingData.dueDate = file.date;
  billingData.projectId = file.projectId;
  billingData.bill = newBill._id;
  billingData.companyId = file.companyId;
  billingData.thumbnail = newFile.location.replace(/pdf$/, "jpg");
  billingData.assetName = newFile.originalname;
  billingData.systemTag = await entityTagController.generateTag("BILL");

  Billing(billingData).save((err, billData) => {
    if (err) {
      console.log(err);
    } else {
      console.log('\x1b[32m%s\x1b[0m', "Billing details added successfully", billData);
    }
  });
}

const getCompanyIdByEmail = async (mail) => {
  var id = undefined;

  var fromEmail = mail.from[0];
  var userInfo = await User.findOne({email: fromEmail.address});

  if (userInfo) {
    id = userInfo.companyId;
  }

  return id;
}

const getProjectIdByEmail = async (mail, cId) => {
  var id = undefined;

  var found =false;

  var projName = mail.subject;
  if (projName) {
    var project = await Project.findOne({projectName: projName});
    
    if (project) {
      id = project._id;
      found = true;
    } else {
      console.log("No such project name.");
    }
  }
  if (!found) {
    var project = await Project.findOne({companyId: cId});
    if (project) {
      id = project._id;
      console.log("Project name was not provided. Choosed first project");
    }
  }

  return id;
}

module.exports = {
  register: async () => {
    const n = notifier(imap);
    n.on('end', () => notifier.start())
      .on('mail', mail => {
        if (mail.attachments && mail.attachments.length > 0 && mail.attachments[0].contentType =="application/pdf") {
          s3upload(mail);
        }
      })
      .start();
  },
}
