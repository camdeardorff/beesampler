//var os = require('os');
//console.log("arch: ", os.arch());
//console.log("cpus: ", os.cpus());
//console.log("endianess: ", os.endianness());
//console.log("free memory: ", os.freemem());
//console.log("total memory: ", os.totalmem());
//console.log("free mem %", os.freemem() / os.totalmem());
//console.log("network int: ", os.networkInterfaces().wlp1s0[0]);

var exec = require('child_process').exec;
var async = require('async');


var WifiControl = function (wifiName) {
	this.ssid = wifiName;
};


WifiControl.prototype.reconnect = function (callback) {
	console.log("reconnect::try to reconnect");

	var wirelessAddress = null;
	var connected = false;

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

	var name = this.ssid;
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


	async.series([scanWifi, getWirelessName, connectToWireless], function (err) {
		callback(err);
	});
};

module.exports = WifiControl;