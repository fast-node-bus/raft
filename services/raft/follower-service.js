function FollowerService(clusterConfig, cmdHandler) {
    this._clusterConfig = clusterConfig;
    this._cmdHandler = cmdHandler;
    this._followerHelper = new FollowerHelper();
}

FollowerService.prototype.appendEntries = function (msg, callback) {
    var self = this;
    if (msg.term < self._raftState.currentTerm) {
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

    // Rule for all roles (when AppendEntries or RequestVote???)
    if(self._raftState.commitIndex>self._raftState.lastApplied){
        self._raftState.lastApplied++;
        var entry = self._raftState.get(self._raftState.lastApplied);
        self._cmdHandler.exec(entry.cmd, function (err) {
            callback(err);
        });
    }

    /////////////
    //self._followerHelper.appendEntries(msg, function (err, result) {
    //    callback(err, result);
    //});

    //self._followerHelper.appendEntries(msg, function (err, result) {
    //    if (err) {
    //        return callback(err);
    //    }
    //
    //    callback(null, result);
    //}, function (result, callback) {
    //    self._cmdHandler.exec(msg.cmd, function (err) {
    //        callback(err);
    //    });
    //});
};

FollowerService.prototype.vote = function (msg, callback) {
    var self = this;
    if(msg.term<self._raftState.currentTerm){
        return callback(null, {votedGranted: false, term: self._raftState.currentTerm});
    }

    //self._followerHelper.vote(msg, function (err, result) {
    //    callback(err, result);
    //});
};

module.exports = FollowerService;