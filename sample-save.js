var jsonfile = require('jsonfile');
const HOLD_FILE = '/home/root/CafSense/savedSamples.json'


/*
Function: Save Failed Sample
Purpose: saves away a sample that was not able to be sent to the server for whatever reason.
Params: sample: {obj}
*/
module.exports = {

	save: function (sample, callback) {
		console.log("save sample: ", sample);
		jsonfile.readFile(HOLD_FILE, function (err, savedData) {
			if (!err) {
				if (!savedData) {
					savedData = {
						samples: []
					}
				} else if (!savedData.samples) {
					savedData.samples = [];
				}
				savedData.samples.push(sample);
				jsonfile.writeFile(HOLD_FILE, savedData, (err) => {
					callback(err);
				});
			} else {
				callback(err);
			}
		});
	},


	removeAll: function (callback) {
		console.log("remove all samples");
		var savedData = {
			samples: []
		};
		jsonfile.writeFile(HOLD_FILE, savedData, (err) => {
			callback(err);
		});
	},


	getAll: function (callback) {
		console.log("get all saved samples");
		jsonfile.readFile(HOLD_FILE, (err, savedData) => {
			if (savedData) {
				var samples = savedData.samples;
				callback(err, savedData.samples);
			} else {
				callback(err);
			}
		});
	}

}