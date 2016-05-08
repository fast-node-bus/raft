var RaftConfig = require('./raft-config');
var Raft = require('./raft');

function RaftService(nodeAddress) {
    var self = this;
    this.isLeader = false;

    this._raftConfig = new RaftConfig(nodeAddress);
    this._raft = new Raft(this._raftConfig);

    this._raft.on('append-entries', function (cmd) {
        cmdHandler.call(self, cmd);
    });
}

RaftService.prototype.setAsLeader = function (nodeAddress) {
    this._raftConfig.setLeader(nodeAddress);
    this.isLeader = true;
};

RaftService.prototype.getLeaderAddress = function () {
    return this._raftConfig.getLeaderAddress();
};

RaftService.prototype.addNode = function (nodeAddress, callback) {
    var self = this;
    var nodeInfo = self._raftConfig.createNodeInfo(nodeAddress);
    self._raft.set(nodeInfo, function (err) {
        if (err) {
            return callback(err);
        }

        self._raftConfig.add(nodeInfo);

        callback(null);
    });
};

var handlers = {};
handlers[Raft.ADD_NODE] = function (data) {

};

function cmdHandler(cmd) {
    var func = handlers[cmd.name];
    func(cmd);
}

module.exports = RaftService;