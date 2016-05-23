function BaseState(raftState) {
    this._raftState = raftState;
    this._context = {};
}

BaseState.prototype.setContext = function (context) {
    this._context = context;
};

BaseState.prototype.appendEntries = function (msg, callback) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._raftState.currentTerm = msg.term;
        self._context.switchToFollower();
    }else if (msg.term < self._raftState.currentTerm) {
        return callback(null, {success: false, term: self._raftState.currentTerm});
    }

    var entry = self._raftState.get(msg.prevLogIndex);

    if (!entry || entry.term != msg.prevLogTerm) {
        return callback(null, {success: false, term: self._raftState.currentTerm});
    }

    var newEntry = msg.entries[0];
    if (newEntry) {
        if (newEntry.term != entry.term) {
            self._raftState.remove(msg.prevLogIndex);
        }

        self._raftState.add(newEntry);
    }

    if (msg.leaderCommit > self._commitIndex) {
        self._raftState.commitIndex = Math.min(msg.leaderCommit, self._raftState.lastIndex);
    }

    // Rule for all roles (when AppendEntries)
    if (self._raftState.commitIndex > self._raftState.lastApplied) {
        self._raftState.lastApplied++;
        var entry = self._raftState.get(self._raftState.lastApplied);
        self._cmdHandler.exec(entry.cmd, function (err) {
            callback(err);
        });
    }
};

BaseState.prototype.requestVote = function (msg, callback) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._raftState.currentTerm = msg.term;
        self._raftState.votedFor = msg.candidateId;
        self._context.switchToFollower();
    }else if (msg.term < self._raftState.currentTerm) {
        return callback(null, {voteGranted: false, term: self._raftState.currentTerm});
    }

    var entry = self._raftState.get(self._raftState.lastApplied);
    var isLogUpToDate = msg.lastLogTerm >= entry.term || (msg.lastLogTerm === entry.term && msg.lastLogIndex >= self._raftState.lastApplied);
    if ((!self._raftState.votedFor || self._raftState.votedFor === msg.candidateId) && isLogUpToDate) {
        self._raftState.votedFor = msg.candidateId;
        return callback(null, {voteGranted: true, term: self._raftState.currentTerm});
    }

    callback(null, {voteGranted: false, term: self._raftState.currentTerm});
};

module.exports = BaseState;