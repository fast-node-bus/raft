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


module.exports = Leader;