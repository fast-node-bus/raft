function LeaderHelper(commitLog) {
    this._commitLog = commitLog;
}

FollowerHelper.prototype.heartBeat = function (resultCb) {
    // TODO: handle msg
    var result = null;
    resultCb(null, result);
};

FollowerHelper.prototype.appendEntries = function (msg, resultCb) {
    // TODO: handle msg
    var result = null;
    resultCb(null, result);
};

module.exports = LeaderHelper;