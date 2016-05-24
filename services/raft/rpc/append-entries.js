function AppendEntries() {

}

AppendEntries.prototype.requestHandler = function (msg, callback) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._raftState.changeTerm(msg.term); //set self._raftState.votedFor = null;
    } else if (msg.term < self._raftState.currentTerm) {
        return callback(null, {success: false, term: self._raftState.currentTerm});
    }

    self._manager.switchToFollower();

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

    callback(null, {success: true, term: self._raftState.currentTerm});

    // Rule for all roles (when AppendEntries)
    //if (self._raftState.commitIndex > self._raftState.lastApplied) {
    //    self._raftState.lastApplied++;
    //    var entry = self._raftState.get(self._raftState.lastApplied);
    //    self._cmdHandler.exec(entry.cmd, function (err) {
    //        callback(err);
    //    });
    //}
};

AppendEntries.prototype.createAppendEntry = function (id) {
    var self = this;
    return {
        term: self._raftState.getCurrentTerm(),
        leaderId: 'leaderId'
    };
};

AppendEntries.prototype.responseHandler = function (msg) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._raftState.changeTerm(msg.term);
        self._manager.switchToFollower();
    }
};