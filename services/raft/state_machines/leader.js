var util = require('util');
var BaseState = require('./base-state');

function Leader() {
    BaseState.call(this);
}

util.inherits(Leader, BaseState);

Leader.prototype.start = function () {

};

Leader.prototype.stop = function () {

};

BaseState.prototype.appendEntries = function (msg, callback) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._raftState.currentTerm = msg.term;
        self._context.switchToFollower();
        return callback(null, {success: true, term: self._raftState.currentTerm});
    }

    callback(null, {success: false, term: self._raftState.currentTerm});
};


module.exports = Leader;