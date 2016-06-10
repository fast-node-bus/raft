var util = require('util');
var BaseRole = require('./base-role');

function Leader(raftState, clusterConfig, requestService) {
    var self = this;
    BaseRole.call(self, raftState, clusterConfig);

    self._requestService = requestService;
    self._callbacks = {};
    self._waitCallbacks = [];
}

util.inherits(Leader, BaseRole);

Leader.prototype.start = function () {
    var self = this;

    function sendAppendEntries(id, noEntries) {
        var msg = self._raftState.createAppendEntriesMsg(id, noEntries);
        self._requestService.send('append-entries', id, msg, function (err, result) {
            console.log(err);
            if (!err) {
                self._handler.checkTerm(result.term, function () {
                    resultHandler(id, msg.entries.length, result);
                });
            }
        });
    }

    function resultHandler(id, entriesCount, result) {
        if (result.success) {
            self._handler.updateFollowerIndex(id, entriesCount, function retry(id) {
                sendAppendEntries(id);
            });

            var majority = self._raftState.getMajority();
            self._handler.updateCommitIndex(majority, function (err, result) {
                var callback = self._callbacks[self._raftState.lastApplied] || function () {
                        // nop
                    };

                delete self._callbacks[self._raftState.lastApplied];

                callback(err, {isLeader: true, value: result});
            });
        } else {
            self._handler.decFollowerIndex(id, result.lastTermIndex, result.lastTerm, function retry(id, inconsistency) {
                sendAppendEntries(id, inconsistency);
            });
        }
    }

    self._raftState.initializeIndex();
    self._requestService.start(sendAppendEntries);
    self._clusterConfig.forEach(function (nodeInfo) {
        sendAppendEntries(nodeInfo.id);
    });
};

Leader.prototype.stop = function () {
    var self = this;
    self._requestService.stop();
    self._callbacks = {};
    self._waitCallbacks = [];
};

Leader.prototype.exec = function (cmd, callback) {
    var self = this;
    self._raftState.addCmd(cmd);
    self._callbacks[self._raftState.lastLogIndex] = callback;
};


// *************************
var ELECTION_TIMEOUT = 3000;
var ROUND_COUNT = 10;

Leader.prototype.addServer = function (nodeAddress, callback) {
    var self = this;
    // TODO: raftState.nextIndex[id] -> new server OR local nextIndex ???

    var node = {nextIndex: self._raftState.lastLogIndex, matchIndex: 0};

    var request = new Request(nodeAddress.host, nodeAddress.port, 300);
    request.start();

    var count = ROUND_COUNT;

    round(checkRound);

    function checkRound(time) {
        if (time > ELECTION_TIMEOUT && count > 0) {
            count--;
            round(checkRound);
        } else if (time < ELECTION_TIMEOUT && count > 0) {
            // TODO: current leader know when config commit
            waitLastConfigCommit(function () {
                addConfig(nodeAddress);
            });
        } else {
            callback(null, {status: 'TIMEOUT'});
        }
    }

    function waitLastConfigCommit(waitCallback) {
        if (self._raftState.commitIndex >= self._raftState.lastLogConfigIndex) {
            return waitCallback();
        }

        self._waitCallbacks.push(waitCallback);
    }

    function addConfig(nodeAddress) {
        var cmd = {value: nodeAddress, name: 'nop'};
        self._raftState.addCmd(cmd);

        // set callback
        self._callbacks[self._raftState.lastLogIndex] = function (err, result) {
            nextConfig();
            callback(err, result);
        };

        // TODO: raftState.addNewConfigCmd() ???
        self._raftState.lastLogConfigIndex = self._raftState.lastLogIndex;
    }

    function nextConfig() {
        var waitCallback = self._waitCallbacks.shift() || function () {
                // nop
            };

        waitCallback();
    }

    function round(finishRound) {
        var start = Date.now();
        var lastRoundIndex = self._raftState.lastLogIndex;
        catchUp(lastRoundIndex, function () {
            var finish = Date.now();
            finishRound(finish - start);
        });

    }

    function catchUp(lastRoundIndex, finishCallback) {
        // Msg with batch entries
        var msg = self._raftState.createAppendEntriesMsg(lastRoundIndex, node.matchIndex);
        request.send('append-entries', msg, function (err, result) {
            if (err) {
                return callback(err);
            }

            updateIndex(result.matchIndex);
            if (result.matchIndex === lastRoundIndex) {
                return finishCallback();
            }

            catchUp(result.matchIndex, finishCallback);
        });
    }

    function updateIndex(matchIndex) {
        node.nextIndex = matchIndex + 1;
        node.matchIndex = matchIndex;
    }
};


BaseRole.prototype.removeServer = function (nodeAddress, callback) {
    var self = this;


};

module.exports = Leader;