var Q = require('q');
var search = require('../../../lib/binary-search');

var BATCH_SIZE = 100;

function RaftState(nodeId, nodes, cmdHandler) {
    var self = this;
    self._cmdHandler = cmdHandler;
    self.nodeId = nodeId;
    self.leaderId = null;
    self._nodesCount = 1;

    self.currentTerm = 0;
    self.votedFor = null;
    self.log = [{term: 0, cmd: {name: 'nop', value: nodes}}];
    self.lastLogConfigIndex = 0;
    self.commitConfigIndex = 0;

    self.lastLogIndex = 0;
    self.lastLogTerm = 0;

    self.commitIndex = 0;
    self.lastApplied = 0;

    self.nextIndex = {};
    self.matchIndex = {};
}

RaftState.prototype.initializeIndex = function () {
    var self = this;
    var nodes = self.log[self.lastLogConfigIndex].cmd.value;
    nodes.forEach(function (nodeInfo) {
        self.nextIndex[nodeInfo.id] = self.lastLogIndex + 1;
        self.matchIndex[nodeInfo.id] = 0;

        self._nodesCount++;
    });
};

// *********** Special for LEADER *********** //
RaftState.prototype.addNode = function (id) {
    var self = this;

    self.nextIndex[id] = self.lastLogIndex + 1;
    self.matchIndex[id] = 0;

    self._nodesCount++;
};

// *********** Special for LEADER *********** //
RaftState.prototype.removeNode = function (id) {
    var self = this;

    delete self.nextIndex[id];
    delete self.matchIndex[id];

    self._nodesCount--;
};

// *********** Special for LEADER *********** //
RaftState.prototype.addCmd = function (cmd, callback) {
    var self = this;
    var entry = {
        term: self.currentTerm,
        cmd: cmd
    };

    self.addEntry(entry);

    self._cmdPomise = self._cmdPomise.then(function (result) {
        callback(result);
        self._cmdDefer = Q.defer();
        return self._cmdDefer.promise;
    });
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
            if (self.lastLogConfigIndex === lastApplied) {
                self.commitConfigIndex = lastApplied;
            }

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
    console.log('Inc term.');
    console.log(this.currentTerm);
};

RaftState.prototype.changeTerm = function (term) {
    this.currentTerm = term;
    this.votedFor = null;
    console.log('Change term.');
    console.log(this.currentTerm);
};

RaftState.prototype.getEntry = function (index) {
    return this.log[index];
};

RaftState.prototype.getLastEntry = function () {
    return this.log[this.lastLogIndex];
};

RaftState.prototype.getFirstEntryIndex = function (term, index) {
    var self = this;
    var entryIndex = search.findFirst(self.log, term, 'term', self.commitIndex, index);

    return entryIndex === -1 ? 1 : entryIndex;
};

RaftState.prototype.addEntry = function (entry) {
    var self = this;
    self.log.push(entry);
    self.lastLogIndex++;
    self.lastLogTerm = entry.term;
};

RaftState.prototype.removeEntries = function (index) {
    var self = this;
    var lastEntry = self.log[index];
    self.log = self.log.slice(0, index + 1);
    self.lastLogIndex = index;
    self.lastLogTerm = lastEntry.term;

    if (self.lastLogConfigIndex > self.lastLogIndex) {
        self.lastLogConfigIndex = self.commitConfigIndex;
    }
};

RaftState.prototype.addEntries = function (entries) {
    var self = this;
    var lastEntry = entries[entries.length - 1];
    self.log = self.log.concat(entries);
    self.lastLogIndex += entries.length;
    self.lastLogTerm = lastEntry.term;
};

RaftState.prototype.getMajority = function () {
    return ((this._nodesCount + 1) / 2 | 0) + 1;
};

RaftState.prototype.createRequestVoteMsg = function () {
    return {
        term: this.currentTerm,
        candidateId: this.nodeId,
        lastLogIndex: this.lastLogIndex,
        lastLogTerm: this.lastLogTerm
    };
};

RaftState.prototype.createAppendEntriesMsg = function (nodeId, noEntries) {
    var self = this;
    var index = self.nextIndex[nodeId];
    var entries = noEntries ? [] : self.log.slice(index, index + BATCH_SIZE);

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


RaftState.prototype.createCatchUpMsg = function () {
    return {
        leaderId: this.nodeId,
        prevLogIndex: this.lastLogIndex,
        entries: [],
        leaderCommit: this.commitIndex
    };
};

module.exports = RaftState;