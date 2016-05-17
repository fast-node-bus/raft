function FollowerService(raftConfig, cmdHandler) {
    this._raftConfig = raftConfig;
    this._cmdHandler = cmdHandler;
    this._followerHelper = new FollowerHelper();
}

FollowerService.prototype.appendEntries = function (msg, callback) {
    var self = this;
    if(msg.term<self._commitLog.currentTerm){
        return callback({success: false, term: self._commitLog.currentTerm});
    }

    var entry=self._commitLog.get(msg.prevLogIndex);
    if(entry.term!=msg.prevLogTerm){
        return callback({success: false, term: self._commitLog.currentTerm});
    }




    self._followerHelper.appendEntries(msg, function (err, result) {
        callback(err, result);
    });

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
    self._followerHelper.vote(msg, function (err, result) {
        callback(err, result);
    });
};

module.exports = FollowerService;