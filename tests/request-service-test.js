var assert = require('assert');
var net = require('net');

var ClusterConfig = require('../services/cluster-config');
var RequestService = require('../services/raft/lib/request-service');
var Message = require('../lib/message2');

var address1 = {host: 'localhost', port: 9000};
var address2 = {host: 'localhost', port: 9001};
var address3 = {host: 'localhost', port: 9002};

var clusterConfig1 = new ClusterConfig(address1, [address2, address3]);
var clusterConfig2 = new ClusterConfig(address2, [address1, address3]);
var clusterConfig3 = new ClusterConfig(address3, [address1, address2]);

function listen(address, method, callback) {
    var server = net.createServer(function (socket) {
        var message = new Message(socket);
        message.listen(method, function (err, result) {
            callback(err, result);
        });
    });

    server.listen(address.port, address.host, function () {

    });
}

describe('First Test', function () {
    var nodes=clusterConfig1.getNodes();
    var requestService = new RequestService(nodes);
    listen(address2, 'test-method', function(err, result){

    });

    listen(address3, 'test-method', function(err, result){

    });



    it('First', function () {
        this.timeout(5000);
        assert.equal(1, 1);
    });
});