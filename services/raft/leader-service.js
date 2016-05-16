var Q = require('q');

var RaftRequest = require('./raft-request');

var HEART_BEAT_DELAY = 100;

function LeaderService(raftConfig, cmdHandler, timeout) {
    this._raftConfig = raftConfig;
    this._cmdHandler = cmdHandler;
    this._timeout = timeout;

    this._requestService = new RequestService(timeout);
}

LeaderService.prototype.exec = function (cmd, callback) {
    var self = this;
    var msg = createCmdMsg(cmd);
    var majority = self._raftConfig.getMajority();
    var count = 1;
    self._requestService.sendAll(msg, function (err, result) {
        if (err) {
            return callback(err);
        }

        if (result.success) {
            count++;
        }

        if (count == majority) {
            self._cmdHandler.exec(cmd, function (err, result) {
                callback(err, result);
            });
        }
    });
};

LeaderService.prototype.start = function () {
    var self = this;

    var leaderId = self._raftConfig.getNodeId();
    var nodes = self._raftConfig.getNodes();

    nodes.forEach(function (nodeInfo) {
        self._requestService.add(nodeInfo);
    });

    self._requestService.onAppendEntries(function (result) {
        // TODO: handle append-entries response
        if (result.success) {
            if (result.term < 34) {

            }
        } else {
            var term = 5;
            var prevLogTerm = 2;
            var prevLogIndex = 45;
            var commitIndex = 44;
            var msg = createMsg(leaderId, term, prevLogTerm, prevLogIndex, commitIndex, ['cmd1', 'cmd2']);
            self._requestService.send(result.from, msg);
        }
    });

    self._requestService.onHeartBeat(function () {
        // TODO: handle request timer elapsed
        var term = 5;
        var prevLogTerm = 2;
        var prevLogIndex = 45;
        var commitIndex = 44;
        var msg = createMsg(leaderId, term, prevLogTerm, prevLogIndex, commitIndex, []);

        return msg;
    });
};

LeaderService.prototype.stop = function () {

};

module.exports = LeaderService;