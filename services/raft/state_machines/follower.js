var util = require('util');
var BaseState = require('./base-state');

function Follower() {
    BaseState.call(this);

    this._timer = new ElectionTimer();
}

util.inherits(Follower, BaseState);

Follower.prototype.start = function () {
    var self = this;
    self._timer.start(function () {
        self._context.switchToCandidate();
    }, 300);
};

Follower.prototype.stop = function () {
    this._timer.stop();
};


module.exports = Follower;