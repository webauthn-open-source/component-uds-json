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

describe("user", function() {
    var umc;
    beforeEach(function() {
        umc = new UdsMongoComponent(dummyComponentManager);
        umc.init();
    });

    afterEach(function() {
        umc.deleteAll("users", {});
        umc.shutdown();
    });

    it("can get updates");
    it("can get complete object");

    describe("getJournal", function() {
        it("get object", function() {
            umc.create("users", {
                name: "adam", // init
                child1: "julia", // init
                child2: "nobody",
                beer: true,
                const: true // never updated
            });
            return umc.findUsers({
                    name: "adam"
                })
                .then((users) => {
                    var u = users[0];
                    // console.log("User", u);
                    u.set("name", "sara"); // update after init
                    u.delete("child1"); // delete after set
                    u.delete("child2"); // delete
                    u.set("child2", "miles"); // set after delete
                    u.set("age", 40); // update without init
                    u.delete("beer"); // delete init
                    var ret = u.getJournal({
                        type: "object"
                    });
                    assert.isObject(ret);
                });
        });

        it("get object with updates only", function() {
            umc.create("users", {
                name: "adam", // init
                child1: "julia", // init
                child2: "nobody",
                beer: true,
                const: true // never updated
            });
            return umc.findUsers({
                    name: "adam"
                })
                .then((users) => {
                    var u = users[0];
                    // console.log("User", u);
                    u.set("name", "sara"); // update after init
                    u.delete("child1"); // delete after set
                    u.delete("child2"); // delete
                    u.set("child2", "miles"); // set after delete
                    u.set("age", 40); // update without init
                    u.delete("beer"); // delete init
                    var ret = u.getJournal({
                        type: "object",
                        update: true,
                        delete: false,
                        init: false
                    });

                    assert.isObject(ret);
                    var expected = {
                        name: "sara",
                        child2: "miles",
                        age: 40
                    };
                    assert.deepEqual(ret, expected);
                });
        });

        it("get object with deletes only", function() {
            umc.create("users", {
                name: "adam", // init
                child1: "julia", // init
                child2: "nobody",
                beer: true,
                const: true // never updated
            });
            return umc.findUsers({
                    name: "adam"
                })
                .then((users) => {
                    var u = users[0];
                    // console.log("User", u);
                    u.set("name", "sara"); // update after init
                    u.delete("child1"); // delete after init
                    u.delete("child2");
                    u.set("child2", "miles"); // set after delete
                    u.set("age", 40); // update without init
                    u.delete("beer"); // delete init
                    var ret = u.getJournal({
                        type: "object",
                        update: false,
                        delete: true,
                        init: false
                    });

                    assert.isObject(ret);
                    var expected = {
                        beer: undefined,
                        child1: undefined
                    };
                    assert.deepEqual(ret, expected);
                });
        });

        it("get object with initial values only", function() {
            umc.create("users", {
                name: "adam", // init
                child1: "julia", // init
                child2: "nobody",
                beer: true,
                const: true // never updated
            });
            return umc.findUsers({
                    name: "adam"
                })
                .then((users) => {
                    var u = users[0];
                    // console.log("User", u);
                    u.set("name", "sara"); // update after init
                    u.delete("child1"); // delete after init
                    u.delete("child2");
                    u.set("child2", "miles"); // set after delete
                    u.set("age", 40); // update without init
                    u.delete("beer"); // delete init
                    var ret = u.getJournal({
                        type: "object",
                        update: false,
                        delete: false,
                        init: true
                    });

                    assert.isObject(ret);
                    console.log ("ret", ret);
                    var expected = {
                        const: true // never updated
                    };
                    console.log ("expected", expected);
                    assert.deepEqual(ret, expected);
                });
        });

        it("get object with updates and deletes only");
        it("get map");
        it("get array");
    });

    describe("createUser", function() {
        it("can create new user", function() {
            var u = umc.createUser();
            // TODO
            // assert.instanceOf (u, User);
            assert.isObject(u);
        });

        it("can set attributes of user", function() {
            var u = umc.createUser();
            u.set("name", "adam");
        });

        it("can get attributes of user", function() {
            var u = umc.createUser();
            var username = "bubba";
            u.set("name", username);
            var ret = u.get("name");
            assert.strictEqual(ret, username);
        });

        it.skip("can commit new user", function() {
            var u = umc.createUser();
            u.set("username", "john");
            u.set("testing", "yup");
            return u.commit()
                .then((ret) => {

                });
        });
    });

    describe("findUsers", function() {
        it("can find and init user", function() {
            return umc.create("users", {
                    username: "bubba",
                    worked: true
                })
                .then(() => {
                    var p = umc.findUsers({
                        username: "bubba"
                    });
                    assert.instanceOf(p, Promise);
                    return p;
                })
                .then((ret) => {
                    assert.isArray(ret);
                    assert.strictEqual(ret.length, 1);
                    var user = ret[0];
                    // TODO: should be instanceOf User
                    assert.isObject(user);
                    assert.strictEqual(user.get("username"), "bubba");
                    assert.strictEqual(user.get("worked"), true);

                });
        });

        it("resolves to empty array when no user found", function() {
            return umc.findUsers({
                    username: "bubba"
                })
                .then((ret) => {
                    assert.isArray(ret);
                    assert.strictEqual(ret.length, 0);
                });
        });

        it("can update attributes of user");
        it("can delete attributes of user");
        it("can update existing user");
        it("can commit updated user");
    });
});

describe("credential", function() {
    it("can create credential");
    it("can find credential");
    it("can update credential");
    it("can set credential attributes");
});

describe.skip("tingodb", function() {
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