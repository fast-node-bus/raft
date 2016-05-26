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
        var msg = self._raftState.createAppendEntriesMsg(id);
        self._requestService.send('append-entries', id, msg, function (err, result) {
            if (!err) {
                self._appendEntries.responseHandler(id, result, msg.entries.length);
            }
        });
    }

    // set onChangeLogIndex func & initialize state
    self._commitLog.initialize(sendAppendEntries);

    nodes.forEach(function (nodeInfo) {
        self._requestService.addNode(nodeInfo);
        self._raftState.addNode(nodeInfo);
    });

    self._requestService.onIdlePeriod(function (id) {
        sendAppendEntries(id);
    });

    self._raftState.onSendAppendEntries(function (id) {
        sendAppendEntries(id);
    });

    self._raftState.onCmdExec(function (err, args) {
        var callback = self._callbacks[args.index];
        delete self._callbacks[args.index];
        callback(err, args.result);
    });

    // TODO: **************************************** //
    self._clusterConfig.onAddNode(function (nodeInfo) {
        self._requestService.addNode(nodeInfo);
        self._raftState.addNode(nodeInfo);
    });

    self._clusterConfig.onRemoveNode(function (nodeInfo) {
        self._requestService.removeNode(nodeInfo);
        self._raftState.removeNode(nodeInfo);
    });
    // TODO: **************************************** //
};

Leader.prototype.stop = function () {
    this._requestService.closeAll();
    self._raftState.onCmdExec(function () {
        // nop
    });
};

Leader.prototype.exec = function (cmd, callback) {
    var self = this;
    self._raftState.addCmd(cmd, callback);
    self._callbacks[self.lastLogIndex] = callback;

    //this._commitLog.add(cmd, callback); // nextIndex++; & onChangeLogIndex
};

module.exports = Leader;