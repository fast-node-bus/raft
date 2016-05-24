var util = require('util');
var BaseState = require('./base-state');

var HEART_BEAT_DELAY = 100;

function Leader(clusterConfig, raftState, commitLog) {
    BaseState.call(this, raftState, commitLog);

    this._clusterConfig = clusterConfig;
    this._requestService = new RequestService(timeout);
}

util.inherits(Leader, BaseState);

Leader.prototype.start = function () {
    var self = this;
    var nodes = self._clusterConfig.getNodes();
    nodes.forEach(function (nodeInfo) {
        self._requestService.add(
            nodeInfo,
            function onHeartBeat(id) {
                var msg = self._appendEntries.createAppendEntry(id);
                self._requestService.send(id, msg, function (err, result) {
                    if (!err) {
                        self._appendEntries.responseHandler(result);
                    }
                });
            });
    });

    self._commitLog.onAddEntry(function (id) {
        var msg = self._appendEntries.createAppendEntry(id);
        self._requestService.send(id, msg, function (err, result) {
            if (!err) {
                self._appendEntries.responseHandler(result);
            }
        });
    });
};

Leader.prototype.stop = function () {
    self._requestService.closeAll()
};

Leader.prototype.exec = function (cmd, callback) {
    this._commitLog.add(cmd, callback);
};

Leader.prototype.appendEntries = function (msg, callback) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._context.switchToFollower();
        self._context.appendEntries(msg, callback);
    } else {
        callback(null, {success: false, term: self._raftState.currentTerm});
    }
};

module.exports = Leader;