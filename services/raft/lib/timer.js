function Timer(period) {
    this._period = period;
    this._timer = null;
    this._callback = function(){
        // nop
    };
}

Timer.prototype.start = function (callback) {
    var self = this;
    console.log('Timer start: '+self._period);
    self._callback = callback;
    self._timer = setTimeout(callback, self._period);
    self._timer.unref();
};

Timer.prototype.stop = function () {
    var self = this;
    console.log('Timer stop: '+self._period);
    clearTimeout(self._timer);
};

Timer.prototype.reset = function () {
    var self = this;
    console.log('Timer reset: '+self._period);
    clearTimeout(self._timer);
    self._timer = setTimeout(self._callback, self._period);
    self._timer.unref();
};

module.exports = Timer;