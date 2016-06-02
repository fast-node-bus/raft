var util = require('util');
var BaseRole = require('./base-role');

function Leader(raftState, clusterConfig, requestService, cmdHandler) {
    var self = this;
    BaseRole.call(self, raftState, clusterConfig);

    self._requestService = requestService;
    self._cmdHandler = cmdHandler;
    self._callbacks = {};
}

util.inherits(Leader, BaseRole);

Leader.prototype.start = function () {
    var self = this;

    function sendAppendEntries(id) {
        var msg = self._raftState.createAppendEntriesMsg(id);
        self._requestService.send('append-entries', id, msg, function (err, result) {
            if (!err) {
                self._handler.checkTerm(result.term, function () {
                    resultHandler(id, result.success);
                });
            }
        });
    }

    function resultHandler(id, success) {
        if (success) {
            self._handler.updateFollowerIndex(id, function retry(id) {
                sendAppendEntries(id);
            });

            var majority = self._clusterConfig.getMajority();
            self._handler.updateCommitIndex(majority, function (err, result) {
                var callback = self._callbacks[self._raftState.lastApplied];
                delete self._callbacks[self._raftState.lastApplied];

                callback(err, {isLeader: true, value: result});
            });
        } else {
            self._handler.decFollowerIndex(id, function retry(id) {
                sendAppendEntries(id);
            });
        }
    }

    self._requestService.start(sendAppendEntries);
    self._clusterConfig.forEach(function (nodeInfo) {
        sendAppendEntries(nodeInfo.id);
    });
};

Leader.prototype.stop = function () {
    var self = this;
    self._requestService.stop();
    self._callbacks = {};
};

Leader.prototype.exec = function (cmd, callback) {
    var self = this;
    self._raftState.addCmd(cmd);
    self._callbacks[self.lastLogIndex] = callback;
};

Leader.prototype.addServer = function (nodeAddress, callback) {
    var self=this;
    // TODO: raftState.nextIndex[id] -> new server ???
    var msg=self._raftState.createAppendEntriesMsg('???');
    var request=new Request(nodeAddress.host, nodeAddress.port, 300);
    request.start();
    request.send('append-entries', msg, function(err, result){
        if(err){
            return callback(null, {status: 'TIMEOUT'});
        }

        if(result){

        }
    });
};


BaseRole.prototype.removeServer = function (nodeAddress, callback) {
    var self=this;


};

module.exports = Leader;