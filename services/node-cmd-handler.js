function NodeCmdHandler(clusterConfig) {
    this._clusterConfig = clusterConfig;
}

NodeCmdHandler.prototype.exec = function (cmd, callback) {
    var func = handlers[cmd.name];

    if (!func) {
        return callback(new Error('Not found handler for cmd: ' + cmd.name));
    }

    func.call(this, cmd);
    callback(null);
};

var handlers = {
    'add-node': function (cmd) {
        var nodeInfo = this._clusterConfig.createNodeInfo(cmd.value);
        this._clusterConfig.add(nodeInfo);
    }
};

module.exports = NodeCmdHandler;