var groveDisplay = require('jsupm_i2clcd');
var os = require('os');

/*
Display
abstracts everything about the seeed lcd display except for pin.
provides application specific methods for displaying application state data.
*/
var Display = function (pin) {
	this.lcd = new groveDisplay.Jhd1313m1(pin);
};


/*
Function: Loudness
Purpose: shows the loudness value provide, formatted on the display.
Params: loudness: number
*/
Display.prototype.loudness = function (loudness) {
	this.lcd.clear();
	this.lcd.setColor(20, 20, 50);
	this.lcd.setCursor(0, 0);
	this.lcd.write("Total Loudness: ");
	this.lcd.setCursor(1, 0);
	this.lcd.write(loudness.toString());
}


/*
Function: Connectiviy State
Purpose: shows the current state of wireless connectivity. Reads the data internally
	and displays it properly.
Params: networkInterfaces: obj from os package
*/
Display.prototype.connectivityState = function () {
	var ni = os.networkInterfaces()
	var ipAddr = null;
	// has wireless connection
	if (ni.wlp1s0) {
		// need the first one
		if (ni.wlp1s0.length > 0) {
			var wireless = ni.wlp1s0[0];
			ipAddr = wireless.address;
		}
	}
	this.lcd.clear();
	this.lcd.setColor(20, 50, 20);
	this.lcd.setCursor(0, 0);
	if (ipAddr) {
		this.lcd.write("Connected: true");
		this.lcd.setCursor(1, 0);
		this.lcd.write("@ " + ipAddr);
	} else {
		this.lcd.write("Connected: false");
	}
}

module.exports = Display;