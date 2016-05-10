function CommitHandler(raftConfig) {
    this._raftConfig = raftConfig;
}

CommitHandler.prototype.exec = function (cmd) {
    var func = handlers[cmd.name] || function () {
            // nop
        };

    func.call(this, cmd);
};

CommitHandler.prototype.error = function (err) {

};

var handlers = {
    'add-node': function (cmd) {
        this._raftConfig.add(cmd.nodeInfo);
    }
};

module.exports = CommitHandler;