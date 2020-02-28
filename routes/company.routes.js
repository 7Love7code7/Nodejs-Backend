const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const company = require("../controllers/company.controller");
const roleCtrl = require("../controllers/roles.controller");
const entityTag = require("../controllers/entityTag.controller");
const policy = require("../helper/policy");

cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

const logoStorage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "companyLogo",
  allowedFormats: ["jpg", "png"],
  filename: function(req, file, cb) {
    cb(undefined, req.user.companyId);
  }
});
const companyLogoParser = multer({ storage: logoStorage });

const termsStorage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "companyTerms",
  //allowedFormats: ["jpg", "png"],
  filename: function(req, file, cb) {
    cb(undefined, req.user.companyId + "-" + Date.now());
  }
});
const termsParser = multer({ storage: termsStorage });

module.exports = (openRoutes, apiRoutes) => {
  /**
   * COMPANY RELATED ROUTES
   */
  apiRoutes
    .route("/createCompany")
    .all(policy.isSuperAdmin) //POST
    .post(company.createCompany); //working

  apiRoutes
    .route("/listAllCompany")
    .all(policy.isSuperAdmin) //GET
    .get(company.listAllCompany); //working

  apiRoutes
    .route("/createCompanyAdmin/:cmp_id")
    .all(policy.isSuperAdmin) //POST
    .post(company.createCompanyAdmin); //working

  apiRoutes
    .route("/getCompanyById/:cmp_id") //GET
    .get(company.getCompanyById);

  apiRoutes
    .route("/updateCompanyAdminById/:adm_id")
    .all(policy.isSuperAdmin)
    .post(company.updateCompanyAdminById);

  apiRoutes
    .route("/updateCompanyById/:cmp_id")
    .all(policy.isManager) //PUT
    .put(company.updateCompanyById);

  apiRoutes
    .route("/toggleCompanyIsActiveById/:c_id")
    .all(policy.isSuperAdmin)
    .put(company.toggleCompanyIsActiveById);

  apiRoutes
    .route("/changeCompanyCurrency")
    .all(policy.isAdmin)
    .put(company.changeCompanyCurrency);

  /**
   * Registration of a new company..
   */
  openRoutes.route("/registerCompany").post(company.registerCompany);

  openRoutes.route("/registerCompanyAdmin/:cmp_id").post(company.registerCompanyAdmin);

  openRoutes.route("/dashboardRegistration").post(company.dashboardRegistration);

  /**
   * EMPLOYEE RELATED ROUTES
   */

  apiRoutes
    .route("/getEmployeeById/:emp_id")
    .all(policy.isManager)
    .get(company.getEmployeeById);

  apiRoutes
    .route("/updateManagerById/:manager_id")
    .all(policy.isAdmin) //PUT
    .put(company.updateManager);

  apiRoutes
    .route("/updateRooferById/:roofer_id")
    .all(policy.isManager) //PUT
    .put(company.updateRoofer);

  apiRoutes
    .route("/updateCompanyLogo")
    .all(companyLogoParser.single("image"))
    .post(company.updateCompanyLogo);

  apiRoutes
    .route("/createBulkRoofer")
    .all(policy.isManager) //POST
    .post(company.bulkInsertRoofers);

  apiRoutes
    .route("/qwerty")
    .all(policy.checkPrivilege("company", "currency"))
    .get((req, res) => {
      return res.status(200).json({
        message: "Route works"
      });
    });

  apiRoutes
    .route("/updateRoleBasedAccess")
    .all(policy.isAdmin)
    .put(company.updateRoleBasedAccess);

  // openRoutes.get("/appendAccess", (req, res) => {
  //   const Company = require("../models/company.model");

  //   Company.find().exec((err, data) => {
  //     data.forEach(v => {
  //       console.log(v._id);
  //       v.privileges = {
  //         company: {
  //           currency: 0,
  //           language: 0
  //         },
  //         userManagement: {
  //           manager: 0,
  //           subContractor: 1,
  //           teamLeader: 2,
  //           worker: 3
  //         },
  //         project: {
  //           createProject: 1,
  //           createPlan: 1,
  //           createInvoice: 1,
  //           processBill: 1,
  //           createTodo: 1,
  //           createCalendarEvents: 1,
  //           createIssues: 1,
  //           createReports: 1,
  //           createMeetingRooms: 1,
  //           createClients: 1,
  //           createOffer: 1
  //         }
  //       };
  //       v.save();
  //     });
  //   });
  // });

  apiRoutes.route("/getAllSystemTags").get(entityTag.getAllSystemTags);

  apiRoutes
    .route("/companyEconomicSettings")
    .all(termsParser.single("file"))
    .put(company.companyEconomicSettings);

  apiRoutes
    .route("/addOrRemoveBillingApprover")
    .all(policy.isAdmin)
    .put(company.addOrRemoveBillingApprover);

  apiRoutes.route("/createPaymentTerm").put(company.createPaymentTerm);

  apiRoutes.route("/saveCalcCompanyInfo").put(company.saveCalcCompanyInfo);

  apiRoutes.route("/updatecompanyinputmethod").put(company.updateCompanyInputMethod);

  apiRoutes.route("/saveemployeedefaultsettings").put(company.updateEmployeeSettings);

  apiRoutes.route("/updateplanfields").put(company.updateControlPlans);

  apiRoutes.route("/sendSimpleMail").post(company.sendSimpleMail);

  apiRoutes.route("/addRoles").post(roleCtrl.addRoles);

  apiRoutes.route("/getCompanyRoles").get(roleCtrl.getCompanyRoles);
};
