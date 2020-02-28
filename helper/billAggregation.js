const AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
const s3 = new AWS.S3();
const Company = require("../models/company.model");
const Asset = require("../models/asset.model");
const Bill = require("../models/billing.model");
function connect(client) {
  return new Promise((resolve, reject) => {
    client.connect();
    client.on("connect", () => {
      client.listMailboxes((err, mailBoxes) => {
        for (let i = 0, len = mailBoxes.length; i < len; i++) {
          if (mailBoxes[i].hasChildren) {
            mailBoxes[i].listChildren((error, children) => {
              let important = children.reduce((acc, x) => {
                if (!acc && x.type === "Important") {
                  acc = x;
                }
                return acc;
              }, null);
              important ? resolve(important) : reject("Important not found");
            });
          }
        }
      });
    });

    client.on("error", e => {
      reject(e);
    });
  });
}

function init() {
  const inbox = require("inbox"),
    fs = require("fs"),
    path = require("path"),
    Envelope = require("envelope"),
    client = inbox.createConnection(false, "imap.gmail.com", {
      secureConnection: true,
      auth: {
        user: "cloudesdev@gmail.com",
        pass: "cloudes123"
      }
    });

  connect(client)
    .then(mailBox => {
      return new Promise((resolve, reject) => {
        client.openMailbox(mailBox.path, (err, box) => {
          if (err) reject(err);
          resolve(box);
        });
      });
    })
    .catch(e => {
      console.log(e);
    });

  client.on("new", message => {
    getMessageData(message.UID)
      .then(eml => {
        let email = new Envelope(eml);
        return email;
      })
      .then(processBill)
      .then(async ([companyId, url, _]) => {
        let assetObj = new Asset({
          assetName: "Email Bill",
          secure_url: url,
          url: url,
          format: "application/pdf"
        });
        assetObj = await assetObj.save();
        assetObj = assetObj.toObject();
        let billingData = {
          billNo: Date.now().toString()
        };
        billingData.bill = assetObj._id;
        billingData.thumbnail = assetObj.secure_url.replace(/pdf$/, "png");
        billingData.companyId = companyId;
        let newBill = new Bill(billingData);
        newBill.save();
      })
      .catch(e => {
        console.log(e);
      });
  });

  async function processBill(email) {
    let subject = email["header"]["subject"],
      companyId = subject.split("|")[1].trim();
    let company = await Company.findOne({ _id: companyId }).lean();
    if (!company) {
      throw "Company in email subject doesn't exist";
    } else {
      let key = `${Date.now()}.pdf`,
        url = `https://s3.ap-south-1.amazonaws.com/3dfilesdata/billingFiles/${key}`;
      return Promise.all([
        companyId,
        url,
        s3
          .putObject({
            Bucket: "3dfilesdata/billingFiles",
            Key: `${Date.now()}.pdf`,
            Body: email["1"]["0"]
          })
          .promise()
      ]);
    }
  }

  function getMessageData(id) {
    return new Promise((resolve, reject) => {
      let messageStream = client.createMessageStream(id);
      let mailData = "";
      messageStream.on("data", data => {
        mailData = mailData + data.toString();
      });
      messageStream.on("end", () => {
        resolve(mailData);
      });
      messageStream.on("error", err => {
        reject(err);
      });
    });
  }
}
module.exports = init;
