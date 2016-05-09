var moment = require('moment');

var IndexArray = require('../lib/index-array');

function RaftConfig(nodeAddress) {
    this._nodeAddress = nodeAddress;
    this._nodesById = new IndexArray('id');
    this._leader = {};
}

RaftConfig.prototype.setLeader = function (nodeAddress) {
    var id = generateId(nodeAddress);
    var nodeInfo = this._nodesById.getIndex(id);
    nodeInfo.isLeader = true;

    this._leader = nodeInfo;
};

RaftConfig.prototype.getLeaderAddress = function () {
    return {
        host: this._leader.host,
        port: this._leader.port
    };
};

RaftConfig.prototype.createNodeInfo = function (nodeAddress) {
    return {
        id: generateId(nodeAddress),
        created: moment.now(),
        host: nodeAddress.host,
        port: nodeAddress.port,
        isLeader: false
    };
};

RaftConfig.prototype.add = function (nodeInfo) {
    this._nodesById.addIndex(nodeInfo);
};

function generateId(nodeAddress) {
    return nodeAddress.host + ':' + nodeAddress.port;
}

module.exports = RaftConfig;


