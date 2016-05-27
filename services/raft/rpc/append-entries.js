function AppendEntries(raftState, commitLog) {
    this._raftState = raftState;
    this._commitLog = commitLog;
}

AppendEntries.prototype.requestHandler = function (msg, callback) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._raftState.changeTerm(msg.term); //set self._raftState.votedFor = null;
    } else if (msg.term < self._raftState.currentTerm) {
        return callback(null, {success: false, term: self._raftState.currentTerm});
    }

    self._manager.switchToFollower();

    var entry = self._commitLog.get(msg.prevLogIndex);

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

    if (msg.leaderCommit > self._commitIndex) {
        var commitIndex = Math.min(msg.leaderCommit, self._raftState.lastIndex);
        self._raftState.changeCommitIndex(commitIndex);
    }

    callback(null, {success: true, term: self._raftState.currentTerm});

    // TODO: 1. find max commitIndex (only for leader; commitIndex > N <= lastLogIndex) do in commitLog? when change matchIndex[]???
    // TODO: 2. apply cmd from commitLog (lastApplied) do in commitLog?

    // Rule for all roles (when AppendEntries)
    //if (self._raftState.commitIndex > self._raftState.lastApplied) {
    //    self._raftState.lastApplied++;
    //    var entry = self._raftState.get(self._raftState.lastApplied);
    //    self._cmdHandler.exec(entry.cmd, function (err) {
    //        callback(err);
    //    });
    //}
};

AppendEntries.prototype.responseHandler = function (nodeId, msg, entriesCount) {
    var self = this;
    if (msg.term > self._raftState.currentTerm) {
        self._raftState.changeTerm(msg.term);
        self._manager.switchToFollower();
    } else {
        if (msg.success) {
            //self._commitLog.successful(nodeId, entriesCount); // update nextIndex+=entriesCount; matchIndex+=entriesCount; & check lastLogIndex>=nextIndex(nodeId) & onChangeLogIndex

            self._raftState.updateIndex(nodeId, entriesCount);
            self._raftState.checkIndex();

            //////////////////////////

            var majority = self._commitLog.majority();
            for (var n = self._commitLog.commitIndex + 1; n <= self._commitLog.lastIndex; n++) {
                var entry = self._commitLog.get(n);
                if (entry.term === self._raftState._currentTerm) {
                    var count = 1;
                    for (var id in self._commitLog.matchIndex) {
                        if (self._commitLog.matchIndex[id] >= n) {
                            count++
                        }
                    }

                    if (count >= majority) {
                        self._raftState.changeCommitIndex(n);
                    }
                }
            }
        } else {
            self._raftState.decIndex(nodeId);
        }
    }
};

module.exports = AppendEntries;
