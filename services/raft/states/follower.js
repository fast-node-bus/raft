var util = require('util');
var BaseState = require('./base-state');

var ELECTION_TIMEOUT=300;

function Follower(raftState, commitLog) {
    BaseState.call(this, raftState, commitLog);

    this._timer = new ElectionTimer(ELECTION_TIMEOUT);
}

util.inherits(Follower, BaseState);

Follower.prototype.start = function () {
    var self = this;
    self._timer.start(function () {
        self._context.switchToCandidate();
    });
};

Follower.prototype.stop = function () {
    this._timer.stop();
};


module.exports = Follower;