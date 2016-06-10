var util = require('util');
var Timer = require('./timer');

function ElectionTimer(maxPeriod, minPerod) {
    Timer.call(this, 0);

    this._maxPeriod = maxPeriod;
    this._minPerod = minPerod;
}

util.inherits(ElectionTimer, Timer);

ElectionTimer.prototype.start = function (callback) {
    var self = this;
    self._period = getRandom(self._maxPeriod, self._minPerod);
    console.log('ETimer start: '+self._period);
    ElectionTimer.super_.prototype.start.call(this, callback);
};

ElectionTimer.prototype.reset = function () {
    var self = this;
    self._period = getRandom(self._maxPeriod, self._minPerod);
    console.log('ETimer reset: '+self._period);
    ElectionTimer.super_.prototype.reset.call(this);
};

function getRandom(max, min) {
    return (max - min) * Math.random() + min;
}

module.exports = ElectionTimer;