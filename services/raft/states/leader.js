var util = require('util');
var BaseState = require('./base-state');

function Leader(raftState, commitLog) {
    BaseState.call(this, raftState, commitLog);
}

util.inherits(Leader, BaseState);

Leader.prototype.start = function () {

};

Leader.prototype.stop = function () {

};

module.exports = Leader;