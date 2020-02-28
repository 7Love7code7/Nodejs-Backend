const User = require("../models/user.model");
const Asset = require("../models/asset.model");
const Company = require("../models/company.model");
const Project = require("../models/project.model");
const Tag = require("../models/tags.model");

module.exports = {

    saveEmployee:async(req,res)=>{
        //create new employee data.
        try{
            let middleName="";
            let employee = req.body;
   
            let tempString = employee.name;
            let temp = tempString.split(" ");
            employee.firstName=temp[0];
            if(temp.length>1){
              employee.lastName=temp[temp.length-1];
            }
           
            await temp.map(name=>{
                if(name==employee.firstName||name==employee.lastName){
                   //console.log("first and last");
                }else{
                   middleName =  middleName+" "+name;
                  
                    employee.middleName= middleName;
                  
                }
            });
            employee.middleName= middleName;
           
   
           employee.designation = "employee";
           employee.companyId = req.user.companyId;
           if (employee.mobile.dialCode.indexOf("+") !== 0) {
             employee.mobile.dialCode = `+${employee.mobile.dialCode}`;
             
           }
           let reqDialCode = employee.mobile.dialCode;
           let reqMobile = employee.mobile.phoneNumber;
           employee.mobile.phoneNumber=employee.mobile.phoneNumber;
           employee.dateOfBirth=req.body.dob._d;
       
           employee.dateOfJoin=req.body.doj._d;
           if (req.files && req.files.length > 0) {
               let file = req.files[0];
              
                   file.companyId = req.user.companyId;                    
              
              let emplpic = new Asset(file);
              let AssetObj = await emplpic.save();
              employee.profilePic = AssetObj.secure_url;
              
               
           }
           for(i = 0; i < employee.listOfSkills.length; i ++) {
              let result = await Tag.findOne(
                { tagName : employee.listOfSkills[i]}
              );
              if(!result) {
                let tag = {
                  tagName: employee.listOfSkills[i],
                  companyId: req.user.companyId
                };
                let newTag = new Tag(tag);
                let saveTag = await newTag.save();
              }
           }
           User.count(
               {
                 mobile: employee.mobile
               },
               (err,present)=>{
                   //console.log("present: ",present);
                   if (present == 0) {
                       //console.log(employee);
                       User(employee).save((err, employee) => {
                         //console.log(err, employee);
                         if (employee) {
                           Company.findByIdAndUpdate(
                             employee.companyId,
                             {
                               $push: {
                                   companyEmployee: employee._id
                               }
                             },
                             {
                               safe: true,
                               upsert: true,
                               new: true
                             },
                            
                           );
                           return res.status(200).json({
                               message: "Employee Saved Successfully.",
                               data:employee
                             });
                         } else {
                           //res -> could not save data
                           return res.status(500).json({
                             errorTag: 100,
                             message: err.message
                           });
                         }
                       });
                     } else {
                       //res -> user already present
                       return res.status(500).json({
                         errorTag: 100,
                         message: present + "Employee with same contact no already exists."
                       });
                     }
               }
           )
        }catch(e){
            return res.status(500).json({
                
                message: "Something went wrong",
                data:e
              });
        }
        
    },


  getAllEmployees: async (req, res) => {
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
    let tags = await Tag.find({companyId: req.user.companyId});
    
    try {
      User.find({
          $or: [{
              firstName: regex
            },
            {
              lastName: regex
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
            },
            {
              "address1.city": regex
            }
          ]
        })
        .where({
          companyId: req.user.companyId,
          designation: "employee"
        })
        .skip(s)
        .limit(chunk)
        .sort('-created')
        .lean()
        .exec((err, list) => {
          if (!err) {
            User.count({
                companyId: req.user.companyId,
                designation: "employee"
              },
              (err, count) => {
                if (!err)
                  return res.status(200).json({
                    total: count,
                    list: list,
                    allskills: tags
                  });
                else
                  return res.status(500).json({
                    errorTag: 100,
                    message: err.message
                  });
              }
            );
          }
        })
    } catch (e) {
      console.log(e)
      return res.status(500).json({
        message: "Internal server error"
      })
    }
  },

  getEmployeeById: async (req, res) => {
    let id = req.params.id;
    if (id) {
      User.findById(id)

        .exec((err, user) => {
          if (user) {
            return res.json(user);
          } else {
            return res.status(500).json({
              err: 500,
              message: "error fetching employee details"
            });
          }
        });
    } else {
      return res.status(401).json({
        errorTag: 101,
        message: "parameter error"
      });
    }
  },

  deleteEmployee: async (req, res) => {
    let id = req.params.id;

    if (!id) {
      return res.status(400).json({
        message: " requested Employee ID is missing"
      })
    }
    try {

      let updatedemp = await User.findByIdAndRemove({
        _id: id
      })

      /* Save all changes */
      await updatedemp.save();

      return res.status(200).json({
        message: "employee deleted successfully"
      })
    } catch (e) {
      console.log(e)
      return res.status(500).json({
        message: "Internal server error"
      })
    }

  },

 

  updateEmployee:async(req,res)=>{
      try{
        let id = req.params.id;
        console.log("employee",req.body);
        if (!id) {
          return res.status(400).json({
            message: " requested ID is missing"
          });
        }
        let middleName="";
        let employee = req.body;
        console.log("employee",employee);
        let tempString = employee.name;
        let temp = tempString.split(" ");
        employee.firstName=temp[0];
        if(temp.length>1){
          employee.lastName=temp[temp.length-1];
        }
        
        await temp.map(name=>{
            if(name==employee.firstName||name==employee.lastName){
               console.log("first and last");
            }else{
               middleName =  middleName+" "+name;
              
                employee.middleName= middleName;
              
            }
        });
      
     
      employee.designation = "employee";
      employee.companyId = req.user.companyId;
      if (employee.mobile.dialCode.indexOf("+") !== 0) {
        employee.mobile.dialCode = `+${employee.mobile.dialCode}`;
      }
      let reqDialCode = employee.mobile.dialCode;
      let reqMobile = employee.mobile.phoneNumber;
      employee.mobile.phoneNumber = req.body.mobile.phoneNumber;
      if (req.body.dateOfBirth._d) {
        employee.dateOfBirth = req.body.dateOfBirth._d;
      }
      if (req.body.dateOfJoin._d) {
        employee.dateOfJoin = req.body.dateOfJoin._d;
      }

      if (req.files && req.files.length > 0) {
        let file = req.files[0];

        file.companyId = req.user.companyId;

        let emplpic = new Asset(file);
        let AssetObj = await emplpic.save();
        employee.profilePic = AssetObj.secure_url;

      }
      let updateduser = await User.findOneAndUpdate({
        _id: id
      }, {
        $set: employee
      }, {
        new: true
      });
      /* Save all changes */
      // await updateduser.save();

      return res.status(200).json({
        message: "employee updated successfully"
      });

    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },


};