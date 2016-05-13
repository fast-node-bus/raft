function FollowerService(raftConfig, cmdHandler) {
    this._raftConfig = raftConfig;
    this._cmdHandler = cmdHandler;
}

FollowerService.prototype.appendEntries = function (msg, callback) {
    // TODO: operate msg

    this._cmdHandler.exec(msg.cmd, function (err, result) {
        callback(err, result);
    });
};

FollowerService.prototype.vote = function (msg, callback) {

};

module.exports = FollowerService;