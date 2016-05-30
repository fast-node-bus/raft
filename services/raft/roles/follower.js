var util = require('util');
var BaseRole = require('./base-role');

var ELECTION_TIMEOUT = 300;

function Follower(raftState) {
    BaseRole.call(this, raftState);

    this._timer = new ElectionTimer(ELECTION_TIMEOUT);
}

util.inherits(Follower, BaseRole);

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
    var self=this;
    self._handler.checkTerm(msg.term, function(){

    });


    self.appendEntries(msg, callback);
};

module.exports = Follower;