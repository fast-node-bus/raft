var util = require('util');
var BaseState = require('./base-state');

var ELECTION_TIMEOUT = 300;

function Follower(raftState, commitLog) {
    BaseState.call(this, raftState, commitLog);

    this._timer = new ElectionTimer(ELECTION_TIMEOUT);
    this._appendEntries = new AppendEntries(raftState, commitLog);
    this._requestVote = new RequestVote(raftState, commitLog);
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

Follower.prototype.appendEntries = function (msg, callback) {
    this._appendEntries.requestHandler(msg, callback);
};

Follower.prototype.requestVote = function (msg, callback) {
    this._requestVote.requestHandler(msg, callback);
};

module.exports = Follower;