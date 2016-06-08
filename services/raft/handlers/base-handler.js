function BaseHandler(raftState, roleManager) {
    this._raftState = raftState;
    this._roleManager = roleManager;
}

BaseHandler.prototype.appendEntries = function (msg, callback) {
    var self = this;

    function finish(success){
        callback(null, {success: success, term: self._raftState.currentTerm, lastLogIndex: self._raftState.lastLogIndex})
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
        return finish(false);
    }

    // TODO: for all entries
    msg.entries.forEach(function(newEntry){

    });

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

    finish(true);
};

BaseHandler.prototype.requestVote = function (msg, callback) {
    var self = this;

    function finish(voteGranted){
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
    if ((!self._raftState.votedFor || self._raftState.votedFor === msg.candidateId) && isLogUpToDate) {
        self._raftState.votedFor = msg.candidateId;
        return finish(true);
    }

    finish(false);
};

module.exports = BaseHandler;
