var turnOnDebugLogging = true;

var UdsMongoComponent = require("../index.js");
var assert = require("chai").assert;

var dummyComponentManager = {
    registerType: function() {},
    getType: function() {},
    register: function() {},
    get: function(name) {
        if (name === "logger") return dummyLogger;
    },
    clear: function() {},
    config: function() {},
    init: function() {},
    shutdown: function() {},
    componentList: new Map(),
    typeList: new Map()
};

var dummyLogger = {
    create: function() {
        return new Proxy(function() {}, {
            get: function() {
                return function(...msg) {
                    if (turnOnDebugLogging) console.log(...msg);
                };
            },
        });
    }
};

describe("UdsMongoComponent", function() {
    var umc;
    beforeEach(function() {
        umc = new UdsMongoComponent(dummyComponentManager);
    });

    afterEach(function() {
        umc.shutdown();
    });

    it("can be initialized", function() {
        var ret = umc.init();
        assert.isUndefined(ret);
    });
});

describe.only("tingodb", function() {
    var umc;
    beforeEach(function() {
        umc = new UdsMongoComponent(dummyComponentManager);
    });

    afterEach(function() {
        return umc.deleteAll({})
            .then(() => {
                return umc.shutdown();
            });
    });

    it("can init tingodb", function() {
        umc.tingoInit();
    });

    it("can create item", function() {
        umc.tingoInit();
        var obj = {
            username: "apowers",
            userId: "apowers@ato.ms"
        };
        var p = umc.create(obj);
        assert.instanceOf(p, Promise);
        return p.then((res) => {
            assert.strictEqual(obj.username, res.username);
            assert.strictEqual(obj.userId, res.userId);
        });
    });

    it("can deleteOne item", function() {
        umc.tingoInit();
        var obj = {
            username: "unique",
            random: Math.random()
        };
        var p = umc.create(obj);
        assert.instanceOf(p, Promise);
        return p.then(() => {
            return umc.deleteOne({
                username: "unique"
            });
        }).then((res) => {
            assert.strictEqual(res, 1);
        });
    });

    it("can createOrUpdate item", function() {
        umc.tingoInit();
        var obj = {
            username: "apowers",
            userId: "apowers@ato.ms"
        };
        var p = umc.createOrUpdate(obj, obj);
        assert.instanceOf(p, Promise);
        return p.then((res) => {
            assert.strictEqual(res, 1);
        });
    });

    it("can update item", function() {
        umc.tingoInit();
        var obj = {
            username: "apowers",
            userId: "apowers@ato.ms"
        };
        var p = umc.create(obj);
        assert.instanceOf(p, Promise);
        return p.then(() => {
            return umc.update(obj, obj);
        }).then((res) => {
            assert.strictEqual(res, 1);
        });
    });

    it("can get item", function() {
        umc.tingoInit();
        var obj = {
            username: "unique",
            random: Math.random()
        };
        var p = umc.create(obj);
        assert.instanceOf(p, Promise);
        return p.then(() => {
            return umc.get({
                username: "unique"
            });
        }).then((res) => {
            assert.strictEqual(res.username, obj.username);
            assert.strictEqual(res.random, obj.random);
        });
    });
});