var ElectionTimer = require('../lib/election-timer');

var ELECTION_TIMEOUT_MAX = 300;
var ELECTION_TIMEOUT_MIN = 150;

function BaseRole(raftState, clusterConfig) {
    this._raftState = raftState;
    this._clusterConfig = clusterConfig;
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

BaseRole.prototype.exec = function (cmd, callback) {
    var leaderId = this._raftState.leaderId;
    if (leaderId) {
        var leaderAddress = this._clusterConfig.getAddress(leaderId);
        return callback(null, {isLeader: true, leaderAddress: leaderAddress});
    }

    callback(null, {isLeader: false, leaderAddress: null});
};

BaseRole.prototype.addServer = function (nodeAddress, callback) {
    sendLeaderAddress.call(this, callback);
};


BaseRole.prototype.removeServer = function (nodeAddress, callback) {
    sendLeaderAddress.call(this, callback);
};

function sendLeaderAddress(callback) {
    var leaderId = this._raftState.leaderId;
    var leaderAddress = null;
    if (leaderId) {
        leaderAddress = this._clusterConfig.getAddress(leaderId);
    }

    callback(null, {status: 'NOT_LEADER', leaderAddress: leaderAddress});
}

module.exports = BaseRole;