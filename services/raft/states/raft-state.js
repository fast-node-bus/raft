var IndexArray = require('../../../lib/index-array');

function RaftState(clusterConfig, cmdHandler) {
    var self = this;
    self._clusterConfig = clusterConfig;
    self._cmdHandler = cmdHandler;
    self.nodeId = clusterConfig.getNodeId();
    self.leaderId = null;

    self.currentTerm = 0;
    self.votedFor = null; // ???
    self.log = [{term: 0}];

    self.lastLogIndex = 0;
    self.lastLogTerm = 0;

    //self.prevLogIndex=?
    //self.prevLogTerm=?

    self.commitIndex = 0;
    self.lastApplied = 0;

    self.nextIndex = {};
    self.matchIndex = {};

    self._nodes = null;
}

// *********** Special for LEADER *********** //
RaftState.prototype.addNode = function (nodeInfo) {
    var self = this;

    self.nextIndex[nodeInfo.id] = self.lastLogIndex + 1;
    self.matchIndex[nodeInfo.id] = 0;

    self._nodes.add(nodeInfo);
};

// *********** Special for LEADER *********** //
RaftState.prototype.removeNode = function (nodeInfo) {
    var self = this;

    delete self.nextIndex[nodeInfo.id];
    delete self.matchIndex[nodeInfo.id];

    self._nodes.remove(nodeInfo.id);
};

//// *********** Special for LEADER *********** //
//RaftState.prototype.updateFollowerIndex = function (nodeId, entriesCount, retryFunc) {
//    var self = this;
//    self.nextIndex[nodeId] += entriesCount;
//    self.matchIndex[nodeId] += entriesCount;
//
//    if (self.lastLogIndex >= self.nextIndex[nodeId]) {
//        retryFunc(nodeId);
//    }
//};
//
//// *********** Special for LEADER *********** //
//RaftState.prototype.decFollowerIndex = function (nodeId, retryFunc) {
//    var self = this;
//    self.nextIndex[nodeId]--;
//    retryFunc(nodeId);
//};
//
//// *********** Special for LEADER *********** //
//RaftState.prototype.updateCommitIndex = function (majority, callback) {
//    var self = this;
//    for (var n = self.commitIndex + 1; n <= self.lastIndex; n++) {
//        var entry = self.getEntry(n);
//        if (entry.term === self.currentTerm) {
//            var count = 1;
//            for (var id in self.matchIndex) {
//                if (self.matchIndex[id] >= n) {
//                    count++
//                }
//            }
//
//            if (count >= majority) {
//                self.changeCommitIndex(n, function (err, result) {
//                    callback(err, result);
//                });
//            }
//        }
//    }
//};

// *********** Special for LEADER *********** //
RaftState.prototype.addCmd = function (cmd) {
    var self = this;
    var entry = {
        term: self.currentTerm,
        cmd: cmd
    };

    self.addEntry(entry);
};

RaftState.prototype.changeCommitIndex = function (commitIndex, callback) {
    var self = this;
    callback = callback || function () {
            // nop
        };

    self.commitIndex = commitIndex;

    while (self.commitIndex > self.lastApplied) {
        self.lastApplied++;
        (function (lastApplied) {
            var entry = self.log[lastApplied];
            self._cmdHandler.exec(entry.cmd, function (err) {
                callback(err);
            });
        })(self.lastApplied);
    }
};

//// ???
//RaftState.prototype.checkTerm = function (term, resultCallback) {
//    var self = this;
//    if (term > self.currentTerm) {
//        self.changeTerm(term);
//        resultCallback();
//    }
//};

RaftState.prototype.changeTerm = function (term) {
    var self = this;
    self.currentTerm = term;
    self.votedFor = null;
};

RaftState.prototype.getEntry = function (index) {
    return self.log[index];
};

RaftState.prototype.addEntry = function (entry) {
    var self = this;
    self.log.push(entry);
    self.lastLogIndex++;
    self.lastLogTerm = entry.term;
};

RaftState.prototype.removeEntry = function (logIndex) {
    var self = this;
    self.log = self.log.slice(0, logIndex);
    self.lastLogIndex = logIndex - 1;
    self.lastLogTerm = self.log[self.lastLogIndex].term;
};

RaftState.prototype.createRequestVoteMsg = function () {
    return {
        term: this.currentTerm,
        candidateId: this.nodeId,
        lastLogIndex: this.lastLogIndex,
        lastLogTerm: this.lastLogTerm
    };
};

RaftState.prototype.createAppendEntriesMsg = function (nodeId) {
    var self = this;
    var index = self.nextIndex[nodeId];
    var entries = self.log.slice(index, index + 1);

    return {
        term: this.currentTerm,
        leaderId: this.nodeId,
        prevLogIndex: this.prevLogIndex,
        prevLogTerm: this.prevLogTerm,
        entries: entries,
        leaderCommit: this.commitIndex
    };
};

module.exports = RaftState;