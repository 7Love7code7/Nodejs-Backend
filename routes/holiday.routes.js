const holiday   = require('../controllers/holiday.controller')
const policy    = require('../helper/policy');

module.exports  = (openRoutes,apiRoutes) =>  {

    apiRoutes.route('/createHoliday').all(policy.isManager)
        .post(holiday.createHoliday)        // TODO : create client

    apiRoutes.route('/listAllHolidays').all(policy.isManager)
        .get(holiday.listAllHolidays)       // TODO : list all client

    apiRoutes.route('/getHolidayById/:h_id')
        .get(holiday.getHolidayById)        // TODO : Get 1 client by id

    apiRoutes.route('/updateHolidayById/:h_id')
        .put(holiday.updateHolidayById)        // TODO : Get 1 client by id

    apiRoutes.route('/deleteHolidayById/:h_id')
        .delete(holiday.deleteHolidayById)

    apiRoutes.route('/createBulkHoliday')
        .post(holiday.createBulkHoliday)    

    apiRoutes.route('/updateHolidayPic').all(policy.isManager)
        .post(holiday.updateHolidayPic)        // TODO : create client
}