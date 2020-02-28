const request       = require("request");
const appId         = "c9e375aa67f3039b2f28ad01e47b3d4d";
const iplocator = require('iplocation');



const getWeatherByLatLon = (lat, lon, cb) => {
        let url = "http://api.openweathermap.org/data/2.5/weather?lat="+lat+"&lon="+lon+"&APPID="+appId;
        request(url, function (error, response, body) {
            if(body)
                body = JSON.parse(body)
            cb(error,body);
        });
}
const getForecast = (lat, lon, cb) => {
        let url = "http://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&APPID="+appId;
        request(url, function (error, response, body) {
            if(body)
                body = JSON.parse(body)
            cb(error,body);
        });
}
module.exports = {

    getWeatherAt : (req,res) => {
        let lat = req.query.lat || 36;
        let lon = req.query.lon || 72;
        if(lat && lon){
            getWeatherByLatLon(lat,lon,(err,response) => {
                if(response)
                    res.json(response);
                else    
                    res.json({errorTag : 105, message : err})    
            })
        }
        else{
            iplocator(req.ip,(e,r) => {
                getWeatherByLatLon(r.latitude,r.longitude,(err,response) => {
                    if(response)
                        res.json(response);
                    else    
                        res.json({errorTag : 105, message : err})    
                })
            })
        }
    },
    
    getForecastAt : (req,res) => {
        let lat = req.query.lat;
        let lon = req.query.lon;
        if(lat && lon){
            getForecast(lat,lon,(err,response) => {
                if(response)
                    res.json(response);
                else    
                    res.json({errorTag : 105, message : err})    
            })
        }
        else{
             iplocator(req.ip,(e,r) => {
                getForecast(r.latitude,r.longitude,(err,response) => {
                    if(response)
                        res.json(response);
                    else    
                        res.json({errorTag : 105, message : err})    
                })
            })
        }    
    }
}