function RaftState(id) {
    this._id = id;
    this._currentTerm = 0;
    this._votedFor = null;
    this._log = [];

    this._commitIndex = 0;
    this._lastApplied = 0;

    this._lastEntry = {term: 0};
}

RaftState.prototype.createVoteMsg = function () {
    return {
        candidateId: this._id,
        term: this._currentTerm,
        lastLogIndex: this._log.length,
        lastLogTerm: this._lastEntry.term
    };
};

module.exports = RaftState;