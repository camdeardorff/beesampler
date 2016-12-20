var exec = require('child_process').exec;
var async = require('async');


var WifiControl = function (wifiName) {
	this.ssid = wifiName;
};


/*
Function: Reconnect
Purpose: reconnects back to the wireless network provided
*/
WifiControl.prototype.reconnect = function (callback) {
	console.log("reconnect:: starting reconnect");

	var wirelessAddress = null;
	var connected = false;

	// scans wireless signals
	var scanWifi = function (callback) {
		console.log("reconnect::scan wifi");
		exec("connmanctl scan wifi", function (error, stdout, stderr) {
			if (error || stderr) {
				// handle error
				callback && callback(error || stderr);
			} else {
				callback && callback();
			}
		});
	};

	// grab this.ssid as name... context switches inside of this block
	var name = this.ssid;
	// gets the symbol name associated with the provided ssid
	var getWirelessName = function (callback) {
		console.log("reconnect::get wireless name");
		exec("connmanctl services | grep '" + name + "'", function (error, stdout, stderr) {
			if (error || stderr) {
				// handle error
				callback && callback(error || stderr);
			} else if (stdout.length < 1) {
				callback && callback("could not find wireless signal");
			} else {
				var out = stdout.split(' ');
				var wifi = out[out.length - 1];
				// set wifi address
				wirelessAddress = wifi;
				callback && callback();
			}
		});
	};

	// checks to see if we are currently connected to this wireless network
	var checkStatus = function (callback) {
		console.log("reconnect::check status");
		exec("connmanctl technologies | grep 'Connected = True'", function (error, stdout, stderr) {
			if (error || stderr) {
				// handle error
				connected = false;
				callback && callback(error || stderr);
			} else {
				if (stdout.length > 0) {
					connected = true;
					callback && callback();
				} else {
					connected = false;
				}
			}
		});
	};

	// connects to the wireless network
	var connectToWireless = function (callback) {
		console.log("reconnect::connect to wireless");
		if (!wirelessAddress) {
			callback("wifi address is undefined");
		} else if (connected) {
			callback("already connected to wifi");
		} else {
			exec("connmanctl connect " + wirelessAddress, function (error, stdout, stderr) {
				if (error || stderr) {
					// handle error
					callback && callback(error || stderr);
				} else {
					console.log("connection restablished");
					callback();
				}
			});
		}
	};

	// complete each of these tasks sequentially
	async.series([scanWifi, getWirelessName, connectToWireless], function (err) {
		callback(err);
	});
};

module.exports = WifiControl;