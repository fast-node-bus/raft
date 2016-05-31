var util = require('util');
var BaseRole = require('./base-role');

function Follower(raftState, clusterConfig) {
    BaseRole.call(this, raftState, clusterConfig);
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
    var self = this;
    self._handler.checkTerm(msg.term, function () {

    });


    self.appendEntries(msg, callback);
};

module.exports = Follower;