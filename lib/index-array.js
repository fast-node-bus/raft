function IndexArray(index) {
    this._index = index;
    this._position = 0;

    this._array = [];
    this._keys = {};

    this.length = 0;
}

IndexArray.prototype.add = function (value) {
    var key = value[this._index];
    var obj = this._keys[key];

    if (!obj) {
        obj = {
            key: key,
            value: value,
            index: this.length
        };

        this._keys[key] = obj;
        this._array.push(obj);
        this.length++;
    }

    return obj.value;
};

IndexArray.prototype.get = function (key) {
    return this._keys[key].value;
};

IndexArray.prototype.getAll = function () {
    return this._array.map(function (obj) {
        return obj.value;
    });
};

IndexArray.prototype.forEach = function (callback) {
    this._array.forEach(function (obj) {
        callback(obj.value);
    });
};

IndexArray.prototype.getNext = function () {
    var value = null;

    if (this._position < this.length) {
        value = this._array[this._position];
        this._position++;
    } else {
        value = this._array[0];
        this._position = 1;
    }

    return value;
};

IndexArray.prototype.remove = function (key) {
    var obj = this._keys[key];

    if (obj) {
        this._array.splice(obj.index, 1);
        delete this._keys[key];
        this.length--;
        return obj.value;
    }

    return null;
};

IndexArray.prototype.clear = function () {
    this.length = 0;
    this._position = 0;

    this._array = [];
    this._keys = {};
};

module.exports = IndexArray;