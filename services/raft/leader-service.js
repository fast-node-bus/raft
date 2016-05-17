function LeaderService(raftConfig, cmdHandler, timeout) {
    this._raftConfig = raftConfig;
    this._cmdHandler = cmdHandler;
    this._timeout = timeout;

    this._requestService = new RequestService(timeout);
    this._leaderHelper = new LeaderHelper();
}

LeaderService.prototype.exec = function (cmd, callback) {
    var self = this;
    var msg = self._leaderHelper.cmd(cmd);
    var majority = self._raftConfig.getMajority();
    var count = 1;
    self._requestService.sendAll(msg, function (err, result) {
        if (err) {
            return callback(err);
        }

        if (result.success) {
            count++;
        }

        if (count == majority) {
            self._cmdHandler.exec(cmd, function (err, result) {
                callback(err, result);
            });
        }
    });
};

LeaderService.prototype.start = function () {
    var self = this;
    var nodes = self._raftConfig.getNodes();

    nodes.forEach(function (nodeInfo) {
        self._requestService.add(nodeInfo);
    });

    self._requestService.onAppendEntries(function (msg, callback) {
        self._leaderHelper.appendEntries(msg, function(err, result){
            if(err){
                return callback(err);
            }

            self._requestService.send(msg.from, result, function(err){
                callback(err);
            });
        });
    });

    self._requestService.onHeartBeat(function (id, callback) {
        self._leaderHelper.heartBeat(function(err, result){
            if(err){
                return callback(err);
            }

            self._requestService.send(id, result, function(err){
                callback(err);
            });
        });

    });
};

LeaderService.prototype.stop = function () {
    self._requestService.closeAll();
};

module.exports = LeaderService;