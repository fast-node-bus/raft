var debug = require('debug')('bus');

function BaseHandler(raftState, roleManager) {
    this._raftState = raftState;
    this._roleManager = roleManager;
}

BaseHandler.prototype.appendEntries = function (msg, callback) {
    var self = this;

    function finish(success) {
        callback(null, {
            success: success,
            term: self._raftState.currentTerm,
            lastLogIndex: self._raftState.lastLogIndex
        });
    }

    if (msg.term > self._raftState.currentTerm) {
        self._raftState.changeTerm(msg.term);
    } else if (msg.term < self._raftState.currentTerm) {
        return finish(false);
    }

    self._raftState.setLeaderId(msg.leaderId);
    self._roleManager.switchToFollower();

    var entry = self._raftState.getEntry(msg.prevLogIndex);
    if (!entry || entry.term != msg.prevLogTerm) {
        var entryIndex = msg.prevLogIndex;
        if (!entry) {
            entry = self._raftState.getLastEntry();
            entryIndex = self._raftState.lastLogIndex
        }

        var firstEntryIndex = self._raftState.getFirstEntryIndex(entry.term, entryIndex);

        return callback(null, {
            success: false,
            term: self._raftState.currentTerm,
            lastTerm: entry.term,
            lastTermIndex: firstEntryIndex
        });
    } else if (msg.entries.length > 0) {
        self._raftState.removeEntries(msg.prevLogIndex);
        self._raftState.addEntries(msg.entries);
    }

    if (msg.leaderCommit > self._raftState.commitIndex) {
        var commitIndex = Math.min(msg.leaderCommit, self._raftState.lastLogIndex);
        self._raftState.changeCommitIndex(commitIndex);
    }

    finish(true);
};

BaseHandler.prototype.requestVote = function (msg, callback) {
    var self = this;

    function finish(voteGranted) {
        callback(null, {voteGranted: voteGranted, term: self._raftState.currentTerm});
    }

    if (msg.term > self._raftState.currentTerm) {
        self._raftState.changeTerm(msg.term);
        self._raftState.setVotedFor(msg.candidateId);
        self._roleManager.switchToFollower();
    } else if (msg.term < self._raftState.currentTerm) {
        return finish(false);
    }

    var entry = self._raftState.getEntry(self._raftState.lastApplied);
    var isLogUpToDate = msg.lastLogTerm > entry.term || (msg.lastLogTerm === entry.term && msg.lastLogIndex >= self._raftState.lastApplied);
    debug('isLogUpToDate' + isLogUpToDate);
    debug(isLogUpToDate);
    debug(self._raftState.votedFor);
    if ((!self._raftState.votedFor || self._raftState.votedFor === msg.candidateId) && isLogUpToDate) {
        self._raftState.votedFor = msg.candidateId;
        return finish(true);
    }

    finish(false);
};

module.exports = BaseHandler;
