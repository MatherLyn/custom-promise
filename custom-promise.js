var CustomPromise = /** @class */ (function () {
    function CustomPromise(executor) {
        this.resolveCallbacks = [];
        this.rejectCallbacks = [];
        this.status = CustomPromise.PENDING;
        this.bindThis();
        this.initialize(executor);
    }
    CustomPromise.prototype.bindThis = function () {
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);
    };
    CustomPromise.prototype.resolve = function (value) {
        var _this = this;
        if (this.status === CustomPromise.PENDING) {
            setTimeout(function () {
                _this.value = value;
                _this.resolveCallbacks.forEach(function (callback) { return callback(value); });
                _this.status = CustomPromise.RESOLVED;
            });
        }
    };
    CustomPromise.prototype.reject = function (reason) {
        var _this = this;
        if (this.status === CustomPromise.PENDING) {
            setTimeout(function () {
                _this.reason = reason;
                _this.rejectCallbacks.forEach(function (callback) { return callback(reason); });
                _this.status = CustomPromise.REJECTED;
            });
        }
    };
    CustomPromise.prototype.initialize = function (executor) {
        try {
            executor(this.resolve, this.reject);
        }
        catch (e) {
            this.reject(e);
        }
    };
    CustomPromise.prototype.then = function (onFulfilled, onRejected) {
        var _this = this;
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function (value) { return value; };
        onRejected = typeof onRejected === 'function' ? onRejected : function (err) { throw err; };
        var promise;
        if (this.status === CustomPromise.RESOLVED) {
            promise = new CustomPromise(function (resolve, reject) {
                setTimeout(function () {
                    try {
                        var x = onFulfilled(_this.value);
                        resolve(x);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
        }
        if (this.status === CustomPromise.REJECTED) {
            promise = new CustomPromise(function (resolve, reject) {
                setTimeout(function () {
                    try {
                        var x = onRejected(_this.value);
                        resolve(x);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
        }
        if (this.status === CustomPromise.PENDING) {
            promise = new CustomPromise(function (resolve, reject) {
                _this.resolveCallbacks.push(function (value) {
                    try {
                        var x = onFulfilled(value);
                        resolve(x);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
                _this.rejectCallbacks.push(function (reason) {
                    try {
                        var x = onRejected(reason);
                        resolve(x);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
        }
    };
    CustomPromise.resolvePromise = function (promise, x, resolve, reject) {
        var _this = this;
        var called = false;
        if (promise === x) {
            return reject(new TypeError('Chaining cycle detected for promise.'));
        }
        if (x instanceof CustomPromise) {
            if (x.status === CustomPromise.PENDING) {
                x.then(function (y) {
                    _this.resolvePromise(promise, y, resolve, reject);
                }, function (reason) {
                    reject(reason);
                });
            }
            else {
                x.then(resolve, reject);
            }
        }
        else if ((x !== null && typeof x === 'object') || typeof x === 'function') {
            try {
                var then = x.then;
                if (typeof then === 'function') {
                    then.call(x, function (y) {
                        if (called)
                            return;
                        called = true;
                        CustomPromise.resolvePromise(promise, y, resolve, reject);
                    }, function (r) {
                        if (called)
                            return;
                        called = true;
                        reject(r);
                    });
                }
                else {
                    resolve(x);
                }
            }
            catch (e) {
                if (called)
                    return;
                called = true;
                reject(e);
            }
        }
        else {
            resolve(x);
        }
    };
    // There must be exactly 3 status in a promise:
    CustomPromise.PENDING = 'pending';
    CustomPromise.RESOLVED = 'resolved';
    CustomPromise.REJECTED = 'rejected';
    CustomPromise.deferred = function () {
        var defer = {
            promise: undefined,
            resolve: undefined,
            reject: undefined
        };
        defer.promise = new CustomPromise(function (resolve, reject) {
            defer.resolve = resolve;
            defer.reject = reject;
        });
        return defer;
    };
    return CustomPromise;
}());
module.exports = {
    CustomPromise
}