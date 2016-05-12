function FollowerService(raftConfig, CmdHandler) {
    this._raftConfig = raftConfig;
    this._cmdHandler = new CmdHandler(raftConfig);
}

FollowerService.prototype.appendEntries = function (msg, callback) {

};

FollowerService.prototype.vote = function (msg, callback) {

};

module.exports = FollowerService;