var net=require('net');

var Message = require('../lib/message2');
var WatchDog=require('../lib/watch-dog');

function Raft(raftConfig) {
    this._raftConfig = raftConfig;
    this._onCommit = function () {
        // nop
    };

    this._watchDog=new WatchDog(300);
    this._watchDog.timeout(function(){
        election.call(this);
    });

    //var socket=net.createConnection(raftConfig.port, raftConfig.host, function(){
    //    var message=new Message(socket);
    //});
    //
    //socket.on('error', function(err){
    //
    //});
}

Raft.prototype.set = function (cmd, callback) {

};

Raft.prototype.heartBeat=function(){
    this._watchDog.reset();
};

Raft.prototype.onCommit = function (callback) {
    this._onCommit = callback;
};

function election(){
    var nodes = this._raftConfig.getNodes();
    nodes.forEach(function(nodeInfo){

    });
}

module.exports = Raft;