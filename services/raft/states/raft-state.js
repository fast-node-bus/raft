var Q = require('q');

function RaftState(nodeId, nodes, cmdHandler) {
    var self = this;
    self._cmdHandler = cmdHandler;
    self.nodeId = nodeId;
    self.leaderId = null;
    self._nodesCount = 1;

    self.currentTerm = 0;
    self.votedFor = null;
    self.log = [{term: 0, cmd: {name: 'cluster', value: nodes}}];
    self.lastClusterLogIndex = 0;

    self._configDefer = Q.defer();
    self._configPomise = self._configDefer.promise;

    self.lastLogIndex = 0;
    self.lastLogTerm = 0;

    self.commitIndex = 0;
    self.lastApplied = 0;

    self.nextIndex = {};
    self.matchIndex = {};
}

RaftState.prototype.initializeIndex = function () {
    var self = this;
    var nodes = log[self.lastClusterLogIndex].cmd.value;
    nodes.forEach(function (nodeInfo) {
        self.nextIndex[nodeInfo.id] = self.lastLogIndex + 1;
        self.matchIndex[nodeInfo.id] = 0;

        self._nodesCount++;
    });

    self._configDefer.resolve();
};

RaftState.prototype.waitLastConfigCommit = function (callback) {
    var self = this;


    self._configPomise = self._configPomise.then(function () {
        callback();
        self._configDefer = Q.defer();
        return self._configDefer.promise;
    });
};

// *********** Special for LEADER *********** //
RaftState.prototype.addNode = function (id, nonVoting) {
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
            if (self.lastClusterLogIndex === lastApplied) {
                self._configDefer.resolve();
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


RaftState.prototype.createCatchUpMsg = function () {
    return {
        leaderId: this.nodeId,
        prevLogIndex: this.lastLogIndex,
        entries: [],
        leaderCommit: this.commitIndex
    };
};

module.exports = RaftState;