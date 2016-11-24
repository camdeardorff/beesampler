var sensorObj = require('jsupm_loudness');

// Instantiate a Loudness sensor on analog pin A0, with an analog
// reference voltage of 5.0
var sensor = new sensorObj.Loudness(0, 5.0);

// Every tenth of a second, sample the loudness and output it's
// corresponding analog voltage. 

var loundness = 0;

setInterval(function () {
	console.log("Detected loudness (volts): " + sensor.loudness());
	loundness += sensor.loudness();
}, 1000);

setInterval(function () {
	console.log("all together loundess: ", loundness);
	console.log("at date: ", new Date().valueOf());
	loundness = 0;
}, 10000)

// exit on ^C
process.on('SIGINT', function () {
	sensor = null;
	sensorObj.cleanUp();
	sensorObj = null;
	console.log("Exiting.");
	process.exit(0);
});

//decibels galileo
//42 0
//100 1.02