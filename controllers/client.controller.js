const Client = require("../models/client.model");
const Asset = require("../models/asset.model");
const Company = require("../models/company.model");
const Project = require("../models/project.model");

module.exports = {
  createClient: async (req, res) => {
    try {
      let client = req.body;
      client.companyId = req.user.companyId;

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          return element;
        });

        let clientAssets = await Asset.insertMany(files);
        client.files = clientAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          }, {
            images: [],
            docs: []
          }
        );
      }
      let clientData = await Client(client).save();
      return res.status(200).json({
        message: "Client created successfully",
        data: clientData
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  listAllClients: async (req, res) => {
    let chunk = null,
      page = null;
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }
    let search = "";
    let regex = null;
    if (req.query.search) {
      regex = new RegExp(req.query.search, "gi");
    } else {
      regex = new RegExp();
    }
    let s = (page - 1) * chunk;
    /* Sort handling */
    let sortObj = {};
    if (req.query.sort && req.query.sortType) {
      console.log("sort", req.query.sort);
      console.log("sort type", req.query.sortType);
      sortObj[req.query.sort] = req.query.sortType === "true" ? 1 : -1;
    } else {
      sortObj = null;
    }

    try {
      console.log("check in req.query=={} in try", req.user.companyId);
      let clientCount = await Client.count({
        clientName: regex,
        companyId: req.user.companyId,
        isActive: true
      });
      let clientsList = await Client.find({
          $or: [{
              clientName: regex
            },
            {
              email: regex
            },
            {
              "address1.line1": regex
            },
            {
              "address1.line2": regex
            },
            {
              "address1.line3": regex
            }
          ],
          isActive: true
        })
        .where({
          companyId: req.user.companyId
        })
        .skip(s)
        .limit(chunk)
        .sort(sortObj)
        .lean();

      /* Get company's default currency */

      return res.json({
        total: clientCount,
        list: clientsList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }

    // Client.find({
    //   $or: [
    //     { clientName: regex },
    //     { email: regex },
    //     { "address1.line1": regex },
    //     { "address1.line2": regex },
    //     { "address1.line3": regex },
    //     { "address1.city": regex }
    //   ]
    // })
    //   .where({ companyId: req.user.companyId })
    //   .sort({ created: -1 })
    //   .skip(s)
    //   .limit(chunk)
    //   .exec((err, list) => {
    //     if (err) {
    //       return res.status(500).json({ errorTag: 100, message: err.message });
    //     }
    //     Client.count(
    //       {
    //         companyId: req.user.companyId
    //       },
    //       (err, count) => {
    //         if (err) {
    //           return res
    //             .status(500)
    //             .json({ errorTag: 100, message: err.message });
    //         } else {
    //           return res.json({ total: count, list: list });
    //         }
    //       }
    //     );
    //   });
  },
  getClientById: (req, res) => {
    let id = req.params.id;
    console.log(id);
    if (id) {
      Client.findById(id)

        .populate("projects")

        .exec((err, clientdata) => {
          if (clientdata) {
            return res.json(clientdata);
          } else {
            return res.status(500).json({
              err: 500,
              message: "error fetching list"
            });
          }
        });
    } else {
      return res.status(401).json({
        errorTag: 101,
        message: "parametre error"
      });
    }
    // let id = req.params.cli_id;
    // Client.findById(id, (err, doc) => {
    //   if (doc) {
    //     Project.count({ clientId: id }, (err, count) => {
    //       doc = doc.toObject();
    //       if (count) doc.projectCount = count;
    //       else doc.projectCount = 0;
    //       console.log(doc);
    //       return res.status(200).json(doc);
    //     });
    //   } else {
    //     return res.status(500).json({ errorTag: 101, message: err.message });
    //   }
    // });
  },

  updateClientById: (req, res) => {
    let id = req.params.cli_id;
    let data = req.body;
    Client.findByIdAndUpdate(id, {
      $set: data
    }, (err, doc) => {
      if (doc) {
        return res.status(200).json(doc);
      } else {
        console.log(err);
        return res.status(500).json({
          error: 500
        });
      }
    });
  },

  addStaffMember: async (req, res) => {
    try {
      let staffObj = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        contact: req.body.contact
      };

      let addStaff = await Client.findOne({
        _id: req.params.id
      });

      addStaff.staff = addStaff.staff.concat([staffObj]);
      let newData = await addStaff.save();
      return res.status(200).json({
        message: "staff member added successfully..",
        data: newData
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  createBulkClient: (req, res) => {
    if (!req.user.companyId) {
      return res.json({
        error: "this user can't do that"
      });
    }
    let clientList = req.body;
    var admin = req.user;
    clientList.map(clientData => {
      clientData.companyId = admin.companyId;
      clientData.providerData = {
        addedBy: {
          _id: admin._id,
          name: admin.firstName + " " + admin.lastName
        }
      };
    });
    var reported = 0;
    let report = () => {
      reported = reported + 1;
      if (reported == clientList.length) return res.send(reported + " added");
    };
    clientList.forEach(function (clientData) {
      Client(clientData).save((err, client) => {
        if (client) {
          Company.findByIdAndUpdate(
            admin.companyId, {
              $push: {
                clients: client._id
              },
              $set: {
                updated: Date.now()
              }
            }, {
              safe: true,
              upsert: true,
              new: true
            },
            (err, result) => {
              if (result) {
                report();
              } else return res.status(500).json({
                errorTag: 100,
                message: err.message
              });
            }
          );
        } else {
          return res.status(500).json({
            errorTag: 100,
            message: err.message
          });
        }
      });
    });
  },

  deleteClientById: (req, res) => {
    let cli_id = req.params.cli_id;
    Client.findByIdAndUpdate(cli_id, {
      $set: {
        isActive: false
      }
    }, err => {
      if (err) {
        return res.status(500).json({
          errorTag: 100,
          message: err.message
        });
      }
      Company.findByIdAndUpdate(req.user.companyId, {
        $pull: {
          clients: cli_id
        }
      }, (err, obj) => {
        if (obj) return res.json(obj);
        else return res.status(500).json({
          errorTag: 100,
          message: err.message
        });
      });
    });
  },

  updateClientLogo: (req, res) => {
    let file = req.file;
    let clientId = req.params.cli_id;
    if (file) {
      Client.findByIdAndUpdate(
        clientId, {
          $set: {
            clientLogo: file.secure_url
          }
        }, {
          $set: {
            updated: Date.now()
          }
        },
        (err, result) => {
          if (result) return res.json(result);
          else return res.status(500).json({
            error: 500,
            message: "couldnt find client"
          });
        }
      );
    } else {
      return res.status(500).json({
        error: 500,
        message: "couldnt upload"
      });
    }
  },

  getAllStaffs: async (req, res) => {
    console.log("getAllStaffs");
    try {
      let lObjClientId = req.params.cli_id;
      if (lObjClientId) {
        let lAryClientDetails = await Client.findById(lObjClientId).lean();
        console.log(lAryClientDetails);
        return res.json({
          data: lAryClientDetails
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json(e);
    }
  }
};