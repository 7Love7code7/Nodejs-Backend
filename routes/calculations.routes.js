const calc = require("../controllers/calculation.controller");
const calctimeline = require("../controllers/calcTimelineViewer.controller");
const policy = require("../helper/policy");
const uid = require('uid-safe');
const async = require('async');

module.exports = (openRoutes, apiRoutes) => {


 apiRoutes.route('/createSheet').post(calc.createSheet);

 apiRoutes.route('/getsheet/:id').get(calc.getSheet);

 apiRoutes.route('/deleteSheet/:id').delete(calc.deleteSheet);

 apiRoutes.route('/getOrCreateSheet/:id').post(calc.getOrCreateSheet);

 apiRoutes.route('/gettotalsales/:id').get(calc.getTotalSales);

 apiRoutes.route('/calcdatastats/:id').get(calc.calcDataStats);

 apiRoutes.route('/getquotedatafromcalc/:id').get(calc.getQuoteDataFromCalc);

 apiRoutes.route('/downLoadCalcSheet/:id').get(calc.getCalcSheetExcel);
 apiRoutes.route('/uploadCalculationData').post(calc.uploadCalculationData);

 apiRoutes.route('/createOngoingCalcChangeReq').post(calc.createOngoingCalcChangeReq);

 apiRoutes.route('/getOngoingCalcRequest/:id').get(calc.getOngoingCalcChangeReq);

 apiRoutes.route('/updateOngoingCalcChangeReq/:id').put(calc.updateOngoingCalcChangeReq);
 apiRoutes.route('/submitOngoingCalcChangeReq/:id').post(calc.submitOngoingCalcChangeReq);
 //apiRoutes.route('/submitOngoingCalcChangeReq/:id').post(calc.submitOngoingCalcChangeReq);
 apiRoutes.route('/submitOngoingToCalc/:id').post(calc.submitOngoingToCalc);

 apiRoutes.route('/getCalcIfcRows').get(calc.getCalcIfcRows);

 apiRoutes.route('/testCalcOngoing').post(calc.testCalcOngoing);

 apiRoutes.route('/syncTimelineToCalcOngoingCR').put(calctimeline.syncTimelineToCalcOngoingCR);
 apiRoutes.route('/getCalcInTimeline/:id').get(calctimeline.getCalcInTimeline);
 apiRoutes.route('/getversions/:id').get(calc.getVersions);



}