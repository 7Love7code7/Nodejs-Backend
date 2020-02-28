const salesCtrl = require("../controllers/sales.controller");

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes.route("/createQuote").post(salesCtrl.createQuote);
  apiRoutes.route("/listAllQuotes").get(salesCtrl.listAllQuotes);
  apiRoutes.route("/listSentQuotes").get(salesCtrl.listSentQuotes);
  apiRoutes.route("/listQuote/:quoteId").get(salesCtrl.listQuote);
  apiRoutes.route("/quote/:quoteId").put(salesCtrl.updateQuote);

};