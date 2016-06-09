var moment = require('moment');

var IndexArray = require('../lib/index-array');

function ClusterConfig(nodeAddress, addresses) {
    var self = this;
    self._nodes = new IndexArray('id');
    self.nodeInfo = self.createNodeInfo(nodeAddress);

    self._addNodeCallback = function () {
        // nop
    };
    self._removeNodeCallback = function () {
        // nop
    };

    // TODO: maybe add itself ???
    addresses.forEach(function (address) {
        var nodeInfo = self.createNodeInfo(address);
        self._nodes.add(nodeInfo);
    });

    console.log(self.nodeInfo);
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

// TODO: maybe return include itself ???
ClusterConfig.prototype.getNodes = function () {
    return this._nodes.getAll();
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


