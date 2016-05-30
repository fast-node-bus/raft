function BaseRole(raftState) {
    this._raftState = raftState;
    this._context = null;
    this._handler = null;
}

BaseRole.prototype.setContext = function (context, Handler) {
    this._context = context;
    this._handler = new Handler(this._raftState, context);
};

BaseRole.prototype.appendEntries = function (msg, callback) {
    this._handler.appendEntries(msg, callback);
};

BaseRole.prototype.requestVote = function (msg, callback) {
    this._handler.requestVote(msg, callback);
};

module.exports = BaseRole;