var express = require('express');
var app = express();

app.get('/',function(req,res){
    res.send("Hello Bharat");
})
app.listen(3000,function(){
    console.log("in server");
});