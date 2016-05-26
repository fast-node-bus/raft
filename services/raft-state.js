var IndexArray = require('../lib/index-array');

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
    self._sendAppendEntries= function () {
        // nop
    };
    self._cmdCallback = function () {
        // nop
    };
}

// *********** Special for LEADER *********** //
RaftState.prototype.onSendAppendEntries = function (sendAppendEntries) {
    var self = this;
    self._sendAppendEntries = sendAppendEntries;
};

// *********** Special for LEADER *********** //
RaftState.prototype.onCmdExec = function (cmdCallback) {
    var self = this;
    self._cmdCallback = cmdCallback;
};

// *********** Special for LEADER *********** //
RaftState.prototype.initialize = function () {
    var self = this;
    self._nodes = new IndexArray('id');
};

// *********** Special for LEADER *********** //
RaftState.prototype.erase = function () {
    var self = this;
    self._nodes = null;
    self._sendAppendEntries= function () {
        // nop
    };
    self._cmdCallback = function () {
        // nop
    };
};

// *********** Special for LEADER *********** //
RaftState.prototype.addNode = function (nodeInfo) {
    var self = this;

    self.nextIndex[nodeInfo.id] = self.lastLogIndex + 1;
    self.matchIndex[nodeInfo.id] = 0;

    self._nodes.add(nodeInfo);
    self._sendAppendEntries(nodeInfo.id);// ?
};

// *********** Special for LEADER *********** //
RaftState.prototype.removeNode = function (nodeInfo) {
    var self = this;

    delete self.nextIndex[nodeInfo.id];
    delete self.matchIndex[nodeInfo.id];

    self._nodes.remove(nodeInfo.id);
};

RaftState.prototype.changeCommitIndex = function (commitIndex) {
    var self = this;
    self.commitIndex = commitIndex;

    while (self.commitIndex > self.lastApplied) {
        self.lastApplied++;
        (function (lastApplied) {
            var entry = self.log[lastApplied];
            self._cmdHandler.exec(entry.cmd, function (err) {
                self._cmdCallback(err, {index: lastApplied})
            });
        })(self.lastApplied);
    }
};

RaftState.prototype.changeTerm = function (term) {
    // ???
};

// *********** Special for LEADER *********** //
RaftState.prototype.updateIndex = function (nodeId, entriesCount) {
    var self = this;
    self.nextIndex[nodeId] += entriesCount;
    self.matchIndex[nodeId] += entriesCount;

    if (self.lastLogIndex >= self.nextIndex[nodeId]) {
        self._sendAppendEntries(nodeId);
    }
};

// *********** Special for LEADER *********** //
RaftState.prototype.decIndex = function (nodeId) {
    var self = this;
    self.nextIndex[nodeId]--;
    self._sendAppendEntries(nodeId);
};

// *********** Special for LEADER *********** //
RaftState.prototype.checkIndex = function () {
    var self = this;

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

// *********** Special for LEADER *********** //
RaftState.prototype.addCmd = function (cmd, callback) {
    var self = this;
    var entry = {
        term: self.currentTerm,
        cmd: cmd
    };

    self.addEntry(entry);
    self._callbacks[self.lastLogIndex] = callback;
    self._nodes.forEach(function (nodeInfo) {
        self._sendAppendEntries(nodeInfo.id);
    });
};

// *********** Special for LEADER *********** //
RaftState.prototype.majority = function () {
    return this._nodes.length / 2 | 0;
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