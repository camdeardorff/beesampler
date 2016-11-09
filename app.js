console.log("Hello World");

var groveSensor = require('jsupm_loudness');
var express = require('express');
var app = express();
var http = require('http-request');
var sensor = new groveSensor.Loudness(0, 5.0);


var fs = require('fs');
//set the sample clock, this block will be executed every n(s)
setInterval(function () {

    var sound = getSoundSample();   
    var reqString = "http://cafbees.herokuapp.com/soundReport/new?decibels="+ 
sound +"&atTime="+ new Date().valueOf();
    console.log("sending request: ", reqString);

    http.post(reqString, function (err, res) {
	if (err || res.code != 200) {
		fs.appendFile('error.log', "Request was unsuccessful: " 
+ reqString + "\n", 
(err) => {
       		    if (err) throw err;
   		 });

		console.error(err);
		return;
	}
    });
}, 10*1000); // ten seconds



function getSoundSample() {
    var sum = 0.0;
    for (var i=0; i<32; i++) {
	var sound = sensor.loudness();
        sum += sound;
    }
    return sum;
}



// exit on ^c
process.on('SIGINT', function()
{
    sensor = null;
    groveSensor.cleanUp();
    groveSensor = null;
    console.log("Exiting.");
    process.exit(0);
});


