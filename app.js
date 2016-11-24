console.log("Running...");

var groveSensor = require('jsupm_loudness');
var groveDisplay = require('jsupm_i2clcd');
var sensor = new groveSensor.Loudness(0, 5.0);
var display = new groveDisplay.Jhd1313m1(0);
var request = require('request');
var jsonfile = require('jsonfile');
var loundnessIntervalTotal = 0;
var failedReports = 0;

const HOLD_FILE = '/home/root/CafSense/savedSamples.json'
const SERVER_LOCATION = "http://cafbees.herokuapp.com/soundReport/new";


function displayLoudness(loudness) {
	display.clear();
	display.setColor(50, 50, 50);
	display.setCursor(0, 0);
	display.write("loudness: ");
	display.setCursor(1, 0);
	display.write(loudness.toString());
}


/*
Function: Check Loudness
Purpose: gets the loudness of the envirnment and adds that to the 
	loudness interval total.
*/
var checkLoundess = function () {
	var loudness = sensor.loudness();
	loundnessIntervalTotal += loudness;
	displayLoudness(loudness);
}


/* 
Function: Get Total Loudness
Purpose: gets the total loudness and resets for the next interval
Returns: number
*/
function getTotalLoudness() {
	var total = loundnessIntervalTotal;
	loundnessIntervalTotal = 0;
	return total;
}


/*
Function: Create Post Data
Purpose: creates and fills the structure of post requests in accordance
	with the request module.
Params: sound: number
Returns: {obj} 
*/
function createPostData(sound) {
	return {
		url: SERVER_LOCATION,
		form: {
			loudness: sound,
			decibels: sound,
			atTime: new Date().valueOf()
		}
	};
}


/*
Function: Save Failed Sample
Purpose: saves away a sample that was not able to be sent to the server
	for whatever reason.
Params: sample: {obj}
*/
function saveFailedSample(sample) {

	jsonfile.readFile(HOLD_FILE, function (err, savedData) {
		console.dir(savedData);
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
var report = function () {
	// create the post data with the current sound sample
	var data = createPostData(getTotalLoudness());

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


// set a timer to get the loudness of the envirnment every second
setInterval(checkLoundess, 1 * 1000);

//set the sample clock, this block will be executed every n(s)
setInterval(report, 10 * 1000); // ten seconds


// exit on ^c
process.on('SIGINT', function () {
	sensor = null;
	groveSensor.cleanUp();
	groveSensor = null;
	console.log("Exiting.");
	process.exit(0);
});