var moment = require('moment');

var IndexArray = require('../lib/index-array');

function ClusterConfig(nodeAddress) {
    this._nodesById = new IndexArray('id');
    this._leader = {};

    this.nodeAddress = nodeAddress;
    this.isLeader = false;
}

ClusterConfig.prototype.setLeader = function (nodeAddress) {
    // TODO: reset old Leader
    if (!nodeAddress) {
        this.isLeader = true;
        nodeAddress = this.nodeAddress;
    }

    var id = generateId(nodeAddress);
    var nodeInfo = this._nodesById.getIndex(id);
    nodeInfo.isLeader = true;

    this._leader = nodeInfo;
};

ClusterConfig.prototype.getLeaderAddress = function () {
    return {
        host: this._leader.host,
        port: this._leader.port
    };
};

ClusterConfig.prototype.createNodeInfo = function (nodeAddress) {
    return {
        id: generateId(nodeAddress),
        created: moment.now(),
        host: nodeAddress.host,
        port: nodeAddress.port,
        isLeader: false
    };
};

ClusterConfig.prototype.add = function (nodeInfo) {
    this._nodesById.add(nodeInfo);
};

ClusterConfig.prototype.getNodeId = function () {
    // TODO: return self ID
};

ClusterConfig.prototype.getNodes = function () {
    // TODO: return all neighboring nodes
};

ClusterConfig.prototype.getMajority = function () {
    // TODO: return amount majority nodes
};


ClusterConfig.prototype.onAddNode = function () {
    // TODO: return amount majority nodes
};

ClusterConfig.prototype.onRemoveNode = function () {
    // TODO: return amount majority nodes
};

function generateId(nodeAddress) {
    return nodeAddress.host + ':' + nodeAddress.port;
}

module.exports = ClusterConfig;


