function LeaderService(raftConfig, connectionManager, CmdHandler) {
    this._raftConfig = raftConfig;
    this._connectionManager = connectionManager;
    this._cmdHandler = new CmdHandler(raftConfig);
}

LeaderService.prototype.exec = function (cmd, callback) {

};

LeaderService.prototype.start = function () {

};

module.exports = LeaderService;