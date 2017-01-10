console.log("Running...");

const WIFI_SSID = "MVNU-student";
const SERVER_LOCATION = "http://cafbees.herokuapp.com";
const NEW_SAMPLE_URL = SERVER_LOCATION + "/samples/new";
const BULK_SAMPLE_URL = SERVER_LOCATION + "/samples/new/bulk";

// utilities
var WifiControl = require('./util/wifi-control');
var wifi = new WifiControl(WIFI_SSID);

var lcdDisplay = require('./util/display');
var display = new lcdDisplay(0);

var sampleDB = require('./util/sample-saver');

// loudness sensor library
var groveSensor = require('jsupm_loudness');
var sensor = new groveSensor.Loudness(0, 5.0);

// libraries
var request = require('request');
// state variables
var compoundLoudness = 0;
var displayState = 0;

const DISPLAY_STATES = {
	CONNECTION: 0,
	LOUDNESS: 1
}


/*
Function: Get Loudness
Purpose: gets the loudness of the envirnment and adds that to the loudness interval total.
Returns: number
*/
function getLoudness() {
	return sensor.loudness() * 100;
}


/*
Function: Create Post Object
Purpose: abstracts the creation of the 'request' http request object
Params: loudness: number
		atTime: Date
Returns: {obj}
*/
function createPostObj(loudness, atTime) {
	return {
		url: NEW_SAMPLE_URL,
		form: {
			loudness: loudness,
			atTime: atTime || new Date().valueOf()
		}
	};
}


/*
Function: Report
Purpose: sends a sample to the server
*/
function report(sendObj, callback) {
	//post the data and handle the aftermath
	request.post(sendObj, function (err, httpResponse, body) {
		if (err || httpResponse.statusCode !== 200) {
			// save the data for when we are able to send a message
			callback(err, sendObj.form);
		} else {
			callback();
		}
	});
}


/*
Function: Change Display State
Purpose: switches the display between connectivity status and loudness
Params: totalLoudness: number
*/
function changeDisplayState(totalLoudness) {
	if (displayState === DISPLAY_STATES.LOUDNESS) {
		display.loudness(totalLoudness);
		displayState = DISPLAY_STATES.CONNECTION
	} else {
		display.connectivityState();
		displayState = DISPLAY_STATES.LOUDNESS
	}
}


/* 
Function: Report Bulk Samples
Purpose: sends all samples that have been stored due to lack of network connectivity
Params: samples: [{obj}]
		callback: ()
*/
function reportBulkSamples(samples, callback) {
	if (samples.length > 0) {
		var sendObj = {
			url: BULK_SAMPLE_URL,
			form: {
				samples: samples
			}
		};
		report(sendObj, function (err) {
			callback(err);
		});
	} else {
		callback("no samples");
	}
}


/*
Function: Send Saved Samples
Purpose: gets all saved samples and sends them
*/
function sendSavedSamples() {
	console.log("ssend saved samples");
	sampleDB.getAll((err, samples) => {
		reportBulkSamples(samples, (err) => {
			if (!err) {
				sampleDB.removeAll((err) => {});
			}
		});
	});
}


// check for residual saved samples on startup
sampleDB.getAll((err, samples) => {
	if (!err && samples) {
		if (samples.length > 0) {
			sendSavedSamples();
		}
	}
});

// counter... tells when to send a report
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
		var sendObj = createPostObj(compoundLoudness, null);
		report(sendObj, function (err, sample) {
			// if there was an error sending the sample
			if (err || sample) {
				// save the sample
				sampleDB.save(sample, function (err) {});
				// try to connect back to the wifi
				wifi.reconnect((err) => {
					if (!err) {
						// send any old samples once reconnected
						sendSavedSamples();
					}
				});
			}
		});
		// switch display
		changeDisplayState(compoundLoudness);
		// reset compound value
		compoundLoudness = 0;
		// reset seconds
		seconds = 0;
	}
	seconds += 1;
}, 1 * 1000);


// exit on ^c
process.on('SIGINT', function () {
	sensor = null;
	groveSensor.cleanUp();
	groveSensor = null;
	console.log("Exiting.");
	process.exit(0);
});
