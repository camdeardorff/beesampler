console.log("Running...");

const WIFI_SSID = "MVNU-student";
const HOLD_FILE = '/home/root/CafSense/savedSamples.json'
const SERVER_LOCATION = "http://cafbees.herokuapp.com/soundReport/new";


// module libraries
var WifiControl = require('./wifi-control');
var wifi = new WifiControl(WIFI_SSID);
console.log(wifi);
var lcdDisplay = require('./display');
var display = new lcdDisplay(0);

var groveSensor = require('jsupm_loudness');
var sensor = new groveSensor.Loudness(0, 5.0);

// libraries
var request = require('request');
var jsonfile = require('jsonfile');
// state variables
var compoundLoudness = 0;
var failedReports = 0;
var displayState = 0;

const DISPLAY_STATES = {
	CONNECTION: 0,
	LOUDNESS: 1
}


/*
Function: Get Loudness
Purpose: gets the loudness of the envirnment and adds that to the 
	loudness interval total.
Returns: number
*/
function getLoudness() {
	return sensor.loudness() * 100;
}


/*
Function: Save Failed Sample
Purpose: saves away a sample that was not able to be sent to the server
	for whatever reason.
Params: sample: {obj}
*/
function saveFailedSample(sample) {

	// try to reconnect
	wifi.reconnect((err) => {
		if (err) {
			console.log("problem with reconnecting: ", err);
		} else {
			console.log("successfully reconnected");
		}
	});

	jsonfile.readFile(HOLD_FILE, function (err, savedData) {
		if (!savedData) {
			savedData = {
				samples: []
			}
		} else if (!savedData.samples) {
			savedData.samples = [];
		}
		savedData.samples.push(sample);
		jsonfile.writeFile(HOLD_FILE, savedData, (err) => {
			console.log(err);
		});
	});
}


/*
Function: Report
Purpose: sends a sample to the server
*/
function report(totalLoudness) {
	// create the post data with the current sound sample
	var data = {
		url: SERVER_LOCATION,
		form: {
			loudness: totalLoudness,
			decibels: totalLoudness,
			atTime: new Date().valueOf()
		}
	};


	//post the data and handle the aftermath
	request.post(data, function (err, httpResponse, body) {
		if (err || httpResponse.statusCode !== 200) {
			// save the data for when we are able to send a message
			saveFailedSample(data.form);
			failedReports += 1;
		} else {
			// send all failed reports if there are any
			if (failedReports > 1) {
				// implement send all
			}
		}
	});
}


function changeDisplayState(totalLoudness) {
	if (displayState === DISPLAY_STATES.LOUDNESS) {
		display.loudness(totalLoudness);
		displayState = DISPLAY_STATES.CONNECTION
	} else {
		display.connectivityState();
		displayState = DISPLAY_STATES.LOUDNESS
	}
}




var seconds = 0;
// event loop, go every second.
setInterval(function () {
	// do the every second stuff
	// get loudness
	var loudness = getLoudness();
	// compound loudness
	compoundLoudness += loudness;

	// check if it is time to do a 10 second operation
	if (seconds > 9) {
		// report compound loudness
		report(compoundLoudness);
		// switch display
		changeDisplayState(compoundLoudness);
		// reset compound value
		compoundLoudness = 0;
		// reset seconds
		seconds = 0;
	}
	seconds += 1;
}, 1 * 1000);

//
//// set a timer to get the loudness of the envirnment every second
//setInterval(checkLoundess, 1 * 1000);
//
////set the sample clock, this block will be executed every n(s)
//setInterval(report, 10 * 1000); // ten seconds


// exit on ^c
process.on('SIGINT', function () {
	sensor = null;
	groveSensor.cleanUp();
	groveSensor = null;
	console.log("Exiting.");
	process.exit(0);
});