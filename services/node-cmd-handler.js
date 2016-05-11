function NodeCmdHandler(raftConfig) {
    this._raftConfig = raftConfig;
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
        this._raftConfig.add(cmd.value);
    }
};

module.exports = NodeCmdHandler;