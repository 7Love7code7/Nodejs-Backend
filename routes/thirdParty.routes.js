const mailer = require('../helper/mailer.controller');
const weather = require('../helper/weather.controller');

module.exports = (openRoutes,apiRoutes) => {
    apiRoutes.route('/getWeatherAt')
        .get(weather.getWeatherAt);
    apiRoutes.route('/getWeatherForecast')
        .get(weather.getForecastAt);    
}