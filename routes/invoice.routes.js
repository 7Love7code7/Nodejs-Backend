const invoiceController = require("../controllers/invoice.controller");

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes.route("/createInvoice").post(invoiceController.createInvoice);

  apiRoutes
    .route("/listAllProjectInvoice/:projectTag")
    .get(invoiceController.listAllProjectInvoice(false));

  apiRoutes
    .route("/listAllProjectVariationOrder/:projectTag")
    .get(invoiceController.listAllProjectInvoice(true));

  apiRoutes
    .route("/updateInvoiceData/:invoiceId")
    .put(invoiceController.updateInvoiceData);

  apiRoutes
    .route("/invoiceApproved")
    .put(invoiceController.updateInvoiceData(true));
};
