var RaftConfig = require('./raft-config');
var Raft = require('./raft');
var RaftHandler = require('./raft-handler');
var CommitHandler = require('./commit-handler');

function RaftService(nodeAddress) {
    this.isLeader = false;

    this._raftConfig = new RaftConfig(nodeAddress);
    this._raft = new Raft(this._raftConfig);

    this._raftHandler=new RaftHandler(this._raftConfig);
    var handler = new CommitHandler(this._raftConfig);
    this._raft.onCommit(function (cmd) {
        handler.exec(cmd);
    });
}

//RaftService.prototype.setAsLeader = function (nodeAddress) {
//    this._raftConfig.setLeader(nodeAddress);
//    this.isLeader = true;
//};

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

        //self._raftConfig.add(nodeInfo);

        callback(null);
    });
};

RaftService.prototype.appendEntries=function(msg, callback){
    //var handler = this._raft.getHandler(msg);

    //var handler = this._raftHandler.get(msg);
    //this._raft(msg, handler);

    //this._raft.
};

module.exports = RaftService;