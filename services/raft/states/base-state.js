var AppendEntries = require('../rpc/append-entries');
var RequestVote = require('../rpc/request-vote');

function BaseState(raftState, commitLog) {
    this._raftState = raftState;
    this._commitLog = commitLog;
    this._context = {};

    this._appendEntries = new AppendEntries(raftState, commitLog);
    this._requestVote = new RequestVote(raftState, commitLog);
}

BaseState.prototype.setContext = function (context) {
    this._context = context;
};

BaseState.prototype.appendEntries = function (msg, callback) {
    this._appendEntries.requestHandler(msg, callback);
};

BaseState.prototype.requestVote = function (msg, callback) {
    this._requestVote.requestHandler(msg, callback);
};

module.exports = BaseState;