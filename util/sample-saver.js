var jsonfile = require('jsonfile');
const HOLD_FILE = '/home/root/CafSense/persistence/saved-samples.json'

module.exports = {

	// takes a sample and pushes it onto the array of saved samples
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

	// empties the array of saved samples
	removeAll: function (callback) {
		console.log("remove all samples");
		var savedData = {
			samples: []
		};
		jsonfile.writeFile(HOLD_FILE, savedData, (err) => {
			callback(err);
		});
	},

	// gets all of the samples from the saved samples array
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
};