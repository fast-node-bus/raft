var EventEmitter = require('events').EventEmitter;
var util = require('util');

function SocketProtocol(socket) {
    EventEmitter.call(this);

    var self = this;
    this._contentLength = null;
    this._buffer = new Buffer(0);
    this._socket = socket;

    socket.on('data', function(data){
        self._onData(data);
    });
    socket.on('error', function (err) {
        self.emit('error', err);
    });
}

util.inherits(SocketProtocol, EventEmitter);

SocketProtocol.REQUEST = 1;
SocketProtocol.RESPONSE = 2;

SocketProtocol.prototype.send = function (type, name, msg, callback) {
    callback = callback || function () {
            // nop
        };

    var messageData = JSON.stringify(msg);
    var dataBuf = new Buffer(messageData);
    var nameBuf = new Buffer(name);

    var offset = nameBuf.length + 11;
    var length = offset + dataBuf.length;

    var buffer = new Buffer(11);

    buffer.writeUIntBE(length, 0, 8);
    buffer.writeUIntBE(offset, 8, 2);
    buffer.writeUIntBE(type, 10, 1);
    buffer = Buffer.concat([buffer, nameBuf, dataBuf], length);

    this._socket.write(buffer, callback);
};

SocketProtocol.prototype._onData = function (data) {
    try {
        this._handleData(data);
    } catch (e) {
        throw e;
    }
};

SocketProtocol.prototype._handleData = function (data) {
    this._buffer = Buffer.concat([this._buffer, data]);

    if (this._contentLength == null) {
        if (this._buffer.length >= 10) {
            var length = this._buffer.readUIntBE(0, 8);
            var offset = this._buffer.readUIntBE(8, 2);

            if (this._buffer.length >= offset) {
                var type = this._buffer.readUIntBE(10, 1);
                var name = this._buffer.toString('utf8', 11, offset);

                this._contentLength = length - offset;
                this._buffer = this._buffer.slice(offset);
            }
        }
    }
    if (this._contentLength != null) {
        if (this._buffer.length == this._contentLength) {
            this._handleMessage(this._buffer, type, name);
        } else if (this._buffer.length > this._contentLength) {
            var message = this._buffer.slice(0, this._contentLength);
            var rest = this._buffer.slice(this._contentLength);
            this._handleMessage(message, type, name);
            this._onData(rest);
        }
    }
};

SocketProtocol.prototype._handleMessage = function (data, type, name) {
    this._contentLength = null;
    this._buffer = new Buffer(0);
    var message;
    try {
        message = JSON.parse(data);
    } catch (e) {
        this.emit(new Error('Could not parse JSON: ' + e.message + '\nRequest data: ' + data));
    }
    message = message || {};

    switch (type) {
        case SocketProtocol.REQUEST:
            this.emit(name, message);
            break;
        case SocketProtocol.RESPONSE:
            this.emit(SocketProtocol.RESPONSE, message);
            break;
    }
};

module.exports = SocketProtocol;

