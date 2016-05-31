var Q = require('q');

function RaftState(nodeId, cmdHandler) {
    var self = this;
    self._cmdHandler = cmdHandler;
    self.nodeId = nodeId;
    self.leaderId = null;
    this._leaderDefer = Q.defer();

    self.currentTerm = 0;
    self.votedFor = null;
    self.log = [{term: 0}];

    self.lastLogIndex = 0;
    self.lastLogTerm = 0;

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
            self._cmdHandler.exec(entry.cmd, function (err, result) {
                callback(err, result);
            });
        })(self.lastApplied);
    }
};

RaftState.prototype.setLeaderId = function (nodeId) {
    this.leaderId = nodeId;
    //if (this.leaderId !== nodeId) {
    //    //this._leaderDefer = Q.defer();
    //    this._leaderDefer.resolve(nodeId);
    //}
};

//RaftState.prototype.getLeaderId = function (callback) {
//    this._leaderDefer.promise = this._leaderDefer.promise.then(callback);
//};

RaftState.prototype.setVotedFor = function (nodeId) {
    this.votedFor = nodeId;
    this.leaderId = null;
    //if (this.leaderId !== nodeId) {
    //    this._leaderDefer = Q.defer();
    //}
};

RaftState.prototype.incTerm = function () {
    this.currentTerm++;
    this.votedFor = null;
};

RaftState.prototype.changeTerm = function (term) {
    this.currentTerm = term;
    this.votedFor = null;
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

    var prevLogIndex = index - 1;
    var prevLogTerm = self.getEntry(prevLogIndex).term;

    return {
        term: self.currentTerm,
        leaderId: self.nodeId,
        prevLogIndex: prevLogIndex,
        prevLogTerm: prevLogTerm,
        entries: entries,
        leaderCommit: self.commitIndex
    };
};

module.exports = RaftState;