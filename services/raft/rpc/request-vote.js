function RequestVote() {

}

RequestVote.prototype.requestHandler = function (msg, callback) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._raftState.changeTerm(msg.term);
        self._raftState.setVotedFor(msg.candidateId);
        self._manager.switchToFollower();
    } else if (msg.term < self._raftState.currentTerm) {
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

RequestVote.prototype.responseHandler = function (msg, callback) {

};

module.exports = RequestVote;