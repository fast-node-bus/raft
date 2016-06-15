var assert = require('assert');
var sinon=require('sinon');

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
        message.listen(method, function (msg, res) {
            res.send(null);
        });
    });

    server.listen(address.port, address.host, function () {
        callback();
    });
}

describe('Lost connection', function () {
    it('Should not callback', function (done) {
        var clusterConfig1 = new ClusterConfig(address1, [address2]);
        var nodes = clusterConfig1.getNodes();
        var requestService = new RequestService(nodes);
        var id = nodes[0].id;
        var callback=sinon.spy();

        requestService.send('test-method', id, 'my msg1', callback);

        setTimeout(function(){
            assert.equal(callback.callCount, 0);
            done();
        }, 1000);
    });

    it('Should not callback 2', function (done) {
        var clusterConfig1 = new ClusterConfig(address1, [address2]);
        var nodes = clusterConfig1.getNodes();
        var requestService = new RequestService(nodes);
        var id = nodes[0].id;
        var callback=sinon.spy();

        requestService.send('test-method', id, 'my msg1', callback);

        setTimeout(function(){
            assert.equal(callback.callCount, 0);
            done();
        }, 1000);
    });

    //it('bla-bla', function (done) {
    //    var clusterConfig1 = new ClusterConfig(address1, [address2]);
    //    var nodes = clusterConfig1.getNodes();
    //    var requestService = new RequestService(nodes);
    //    var id = nodes[0].id;
    //
    //    requestService.send('test-method', id, 'my msg1', function (err, result) {
    //        requestService.send('test-method', id, 'my msg2', function (err, result) {
    //            requestService.send('test-method', id, 'my msg3', function (err, result) {
    //                listen(address2, 'test-method', function(){
    //                    done();
    //                })
    //            });
    //        });
    //    });
    //});
});

//describe('First Test', function () {
//    var clusterConfig1 = new ClusterConfig(address1, [address2]);
//    var nodes = clusterConfig1.getNodes();
//    var requestService = new RequestService(nodes);
//    requestService.start(function (id) {
//        console.log('id: ' + id);
//        requestService.send('test-method', id, {id: id, hello: 'hello'}, function (err, result) {
//            console.log(err);
//            console.log(result);
//        });
//    });
//
//
//    //listen(address3, 'test-method', function (msg, res) {
//    //    console.log(msg);
//    //    res.send('Ok: '+ msg.id);
//    //});
//
//
//    it('First', function (done) {
//        this.timeout(7000);
//        setTimeout(function () {
//            console.log("Listen address2...");
//            listen(address2, 'test-method', function (msg, res) {
//                console.log(msg);
//                res.send('Ok: ' + msg.id);
//            });
//        }, 2000);
//
//        setTimeout(function () {
//            done();
//        }, 3000)
//    });
//});

//describe('Second Test', function () {
//    var nodes = clusterConfig1.getNodes();
//    var requestService = new RequestService(nodes);
//    requestService.start(function(id){
//        console.log('id: '+id);
//        requestService.send('test-method', id, {id: id, hello: 'hello'}, function(err, result){
//            console.log(err);
//            console.log(result);
//        });
//    });
//
//
//    //listen(address3, 'test-method', function (msg, res) {
//    //    console.log(msg);
//    //    res.send('Ok: '+ msg.id);
//    //});
//
//
//    it('First', function (done) {
//        this.timeout(7000);
//        setTimeout(function(){
//            listen(address2, 'test-method', function (msg, res) {
//                console.log(msg);
//                res.send('Ok: '+ msg.id);
//            });
//        }, 3000);
//
//        setTimeout(function(){
//            done();
//        }, 6000)
//    });
//});
