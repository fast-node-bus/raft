function FollowerHelper(commitLog) {
    this._commitLog = commitLog;
}

FollowerHelper.prototype.vote = function (msg, resultCb) {
    // TODO: handle msg
    var result = null;
    resultCb(null, result);
};

FollowerHelper.prototype.appendEntries = function (msg, resultCb, commitCb) {
    // TODO: handle msg
    var result = null;
    if (1) {
        resultCb(null, result)
    } else if (2) {
        commitCb(result, function (err) {
            if (err) {
                return resultCb(err);
            }

            resultCb(result);
        });
    }
};

module.exports = FollowerHelper;