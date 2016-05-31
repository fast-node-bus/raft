var Client = require('./client');

var TRY_DELAY = 1000;
var FIND_LEADER_ATTEMPT = 3;

function ClientService(nodeAddress) {
    this._nodeAddress = nodeAddress;
}

ClientService.prototype.addNode = function (seeds, callback) {
    var seedCounter = 0;
    var attempt = FIND_LEADER_ATTEMPT;
    var nodeAddress = this._nodeAddress;

    function tryAddNode(seedHost, seedPort) {
        console.log('Try add node.')
        var client = new Client(seedHost, seedPort);
        client.addNode(nodeAddress, function (err, result) {
            if (err) {
                return callback(err);
            }

            if (seedCounter > seeds.length) {
                return callback(new Error('Seeds failed.'));
            }

            if (attempt === 0) {
                return callback(new Error('Find leader failed.'));
            }

            if (result.fail) {
                seedCounter++;
                var seed = seeds[seedCounter];
                return tryAddNode(seed.host, seed.port);
            }

            // Try later
            if (result.inElection) {
                attempt--;
                return setTimeout(function () {
                    tryAddNode(seedHost, seedPort);
                }, TRY_DELAY);
            }

            if (!result.isLeader) {
                attempt--;
                return tryAddNode(result.leaderAddress.host, result.leaderAddress.port);
            }

            callback(null);
        });
    }

    var seed = seeds[seedCounter];
    tryAddNode(seed.host, seed.port);
};

module.exports = ClientService;