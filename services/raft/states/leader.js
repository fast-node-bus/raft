var util = require('util');
var BaseState = require('./base-state');

var HEART_BEAT_DELAY = 100;

function Leader(clusterConfig, raftState, commitLog) {
    BaseState.call(this, raftState, commitLog);

    this._clusterConfig = clusterConfig;
    this._requestService = new RequestService();
}

util.inherits(Leader, BaseState);

Leader.prototype.start = function () {
    var self = this;
    var nodes = self._clusterConfig.getNodes();

    function sendAppendEntries(id) {
        var msg = self._appendEntries.create(id);
        self._requestService.send('append-entries', id, msg, function (err, result) {
            if (!err) {
                self._appendEntries.responseHandler(id, result);
            }
        });
    }

    self._commitLog.initialize(sendAppendEntries);

    nodes.forEach(function (nodeInfo) {
        self._requestService.add(nodeInfo, sendAppendEntries);
    });
};

Leader.prototype.stop = function () {
    self._requestService.closeAll()
};

Leader.prototype.exec = function (cmd, callback) {
    this._commitLog.add(cmd, callback); // nextIndex++; & onChangeLogIndex
};

module.exports = Leader;