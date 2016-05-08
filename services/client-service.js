var Client = require('./client');

var SEED_DELAY = 1000;
var FIND_LEADER_ATTEMPT = 3;

function ClientService(nodeAddress) {
    this._nodeAddress = nodeAddress;
}

ClientService.prototype.addNode = function (seeds, callback) {
    var seedCounter = 0;
    var attempt = FIND_LEADER_ATTEMPT;
    var nodeAddress = this._nodeAddress;

    function tryAddNode(seedHost, seedPort) {
        var client = new Client(seedHost, seedPort);
        seedCounter++;
        client.addNode(nodeAddress, function (err, result) {
            if (err) {
                return callback(err);
            }

            if (seedCounter == seeds.length) {
                return callback(new Error('Seeds failed.'));
            }

            if (attempt === 0) {
                return callback(new Error('Find leader failed.'));
            }

            if (result.timeout) {
                var seed = seeds[seedCounter];
                return tryAddNode(seed.host, seed.port);
            }

            if (result.fail) {
                return setTimeout(function () {
                    var seed = seeds[seedCounter];
                    tryAddNode(seed.host, seed.port);
                }, SEED_DELAY);
            }

            if (result.notLeader) {
                attempt--;
                return tryAddNode(result.host, result.port);
            }

            callback(null);
        });
    }

    var seed = seeds[seedCounter];
    tryAddNode(seed.host, seed.port);
};

module.exports = ClientService;