function BaseHandler(raftState, roleManager) {
    this._raftState = raftState;
    this._roleManager = roleManager;
}

BaseHandler.prototype.appendEntries = function (msg, callback) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._raftState.changeTerm(msg.term);
    } else if (msg.term < self._raftState.currentTerm) {
        return callback(null, {success: false, term: self._raftState.currentTerm});
    }

    self._raftState.setLeaderId(msg.leaderId);
    self._roleManager.switchToFollower();

    var entry = self._raftState.getEntry(msg.prevLogIndex);

    if (!entry || entry.term != msg.prevLogTerm) {
        return callback(null, {success: false, term: self._raftState.currentTerm});
    }

    // TODO: for all entries
    var newEntry = msg.entries[0];
    if (newEntry) {
        if (newEntry.term != entry.term) {
            self._raftState.removeEntry(msg.prevLogIndex);
        }

        self._raftState.addEntry(newEntry);
    }

    if (msg.leaderCommit > self._raftState.commitIndex) {
        var commitIndex = Math.min(msg.leaderCommit, self._raftState.lastLogIndex);
        self._raftState.changeCommitIndex(commitIndex);
    }

    callback(null, {success: true, term: self._raftState.currentTerm});
};

BaseHandler.prototype.requestVote = function (msg, callback) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._raftState.changeTerm(msg.term);
        self._raftState.setVotedFor(msg.candidateId);
        self._roleManager.switchToFollower();
    } else if (msg.term < self._raftState.currentTerm) {
        return callback(null, {voteGranted: false, term: self._raftState.currentTerm});
    }

    var entry = self._raftState.get(self._raftState.lastApplied);
    var isLogUpToDate = msg.lastLogTerm > entry.term || (msg.lastLogTerm === entry.term && msg.lastLogIndex >= self._raftState.lastApplied);
    if ((!self._raftState.votedFor || self._raftState.votedFor === msg.candidateId) && isLogUpToDate) {
        self._raftState.votedFor = msg.candidateId;
        return callback(null, {voteGranted: true, term: self._raftState.currentTerm});
    }

    callback(null, {voteGranted: false, term: self._raftState.currentTerm});
};

module.exports = BaseHandler;
