const calcrequest = require("../controllers/calcChangeRequest.controller");
const policy = require("../helper/policy");
const uid = require('uid-safe');
const async = require('async');

module.exports = (openRoutes, apiRoutes) => {
    apiRoutes.route('/changeReqCalc/:id').post(calcrequest.changeReqCalc);

    apiRoutes.route('/getListChangeReqCalc/:id').get(calcrequest.getListChangeRequets);
    apiRoutes.route('/getListCountChangeReqCalc/:id').get(calcrequest.getListCountChangeReqCalc);

    apiRoutes.route('/updateListChangeReqCalc/:id').put(calcrequest.updateListChangeReqCalc);

    apiRoutes.route('/updateCalcIfcRows/:id').put(calcrequest.updateCalcIfcRows);

    apiRoutes.route('/getCalcIfcRows/:id').get(calcrequest.getCalcIfcRows);

    //ongoing calc change request put request, This creates put request to create and update 
    apiRoutes.route('/syncViewerToCalcOngoingCR').put(calcrequest.syncViewerToCalcOngoingCR);

    apiRoutes.route('/testjson').get(calcrequest.TESTJSON);

    apiRoutes.route('/test/updateCalcDataWithCR/:id').get(calcrequest.updateCalcDataWithCR);

}

