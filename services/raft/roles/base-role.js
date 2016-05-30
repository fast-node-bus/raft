var ElectionTimer = require('../lib/election-timer');

var ELECTION_TIMEOUT_MAX = 300;
var ELECTION_TIMEOUT_MIN = 150;

function BaseRole(raftState) {
    this._raftState = raftState;
    this._context = null;
    this._handler = null;

    this._timer = new ElectionTimer(ELECTION_TIMEOUT_MAX, ELECTION_TIMEOUT_MIN);
}

BaseRole.prototype.setContext = function (context, Handler) {
    this._context = context;
    this._handler = new Handler(this._raftState, context);
};

BaseRole.prototype.appendEntries = function (msg, callback) {
    this._handler.appendEntries(msg, callback);
};

BaseRole.prototype.requestVote = function (msg, callback) {
    this._handler.requestVote(msg, callback);
};

module.exports = BaseRole;