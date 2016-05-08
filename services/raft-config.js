function RaftConfig(nodeAddress) {
    this._nodeAddress = nodeAddress;
}

RaftConfig.prototype.setLeader = function (nodeAddress) {

};

RaftConfig.prototype.getLeaderAddress = function (nodeAddress) {
    return null;
};

RaftConfig.prototype.createNodeInfo = function (nodeAddress) {
    return null;
};

RaftConfig.prototype.add = function (nodeInfo) {

};

module.exports = RaftConfig;


