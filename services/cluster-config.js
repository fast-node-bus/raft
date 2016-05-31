var moment = require('moment');

var IndexArray = require('../lib/index-array');

function ClusterConfig(nodeAddress) {
    this._nodes = new IndexArray('id');
    this.nodeInfo = this.createNodeInfo(nodeAddress);

    this._addNodeCallback = function () {
        // nop
    };
    this._removeNodeCallback = function () {
        // nop
    };

    console.log(this.nodeInfo);
}

ClusterConfig.prototype.getAddress = function (id) {
    return this._nodes.get(id);
};

ClusterConfig.prototype.createNodeInfo = function (nodeAddress) {
    return {
        id: generateId(nodeAddress),
        created: moment.now(),
        host: nodeAddress.host,
        port: nodeAddress.port
    };
};

ClusterConfig.prototype.add = function (nodeInfo) {
    this._nodes.add(nodeInfo);
    this._addNodeCallback(nodeInfo);
    console.log(this.nodeInfo);
};

ClusterConfig.prototype.remove = function (id) {
    this._nodes.remove(id);
    this._removeNodeCallback(id);
};

ClusterConfig.prototype.getNodeId = function () {
    return this.nodeInfo.id;
};

ClusterConfig.prototype.forEach = function (callback) {
    this._nodes.forEach(callback);
};

ClusterConfig.prototype.getMajority = function () {
    return ((this._nodes.length + 1) / 2 | 0) + 1;
};

ClusterConfig.prototype.onAddNode = function (addNodeCallback) {
    this._addNodeCallback = addNodeCallback;
};

ClusterConfig.prototype.onRemoveNode = function (removeNodeCallback) {
    this._removeNodeCallback = removeNodeCallback;
};

function generateId(nodeAddress) {
    return nodeAddress.host + ':' + nodeAddress.port;
}

module.exports = ClusterConfig;


