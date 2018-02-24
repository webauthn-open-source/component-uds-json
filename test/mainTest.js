var turnOnDebugLogging = true;

var UdsMongoComponent = require("../index.js");
var {
    User,
    Credential
} = require("component-user-class");
var helpers = require("./helpers/helpers");
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

describe("user data store", function() {
    var umc;
    beforeEach(function() {
        umc = new UdsMongoComponent(dummyComponentManager);
        umc.init();
    });

    afterEach(function() {
        return helpers.dbDeleteAll(umc, "users", {})
            .then(() => {
                umc.shutdown();
            });
    });

    it("can get updates");
    it("can get complete object");

    describe("createUser", function() {
        it("can create new user", function() {
            var u = umc.createUser();
            assert.instanceOf(u, User);
        });

        it("can set attributes of user", function() {
            var u = umc.createUser();
            u.set("username", "adam");
        });

        it("can get attributes of user", function() {
            var u = umc.createUser();
            var username = "bubba";
            u.set("username", username);
            var ret = u.get("username");
            assert.strictEqual(ret, username);
        });

        it("can commit new user", function() {
            var u = umc.createUser();
            u.set("username", "john");
            u.set("testing", "yup");
            return u.commit()
                .then((ret) => {
                    assert.strictEqual(ret, 1);
                    return helpers.dbGet(umc, "users", {
                        username: "john"
                    });
                })
                .then((ret) => {
                    assert.isObject(ret);
                    assert.strictEqual(ret.username, "john");
                    assert.strictEqual(ret.testing, "yup");
                    assert.isDefined(ret._id);
                });
        });
    });

    describe("findUsers", function() {
        it("can find and init user", function() {
            return helpers.dbCreate(umc, "users", {
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
                    assert.instanceOf(user, User);
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

    describe("createCredential", function() {
        it("can create credential", function() {
            var u = umc.createUser();
            u.set("username", "bob");
            var c = u.createCredential();
            assert.instanceOf(c, Credential);
            var username = c.get("username");
            assert.strictEqual(username, "bob");
        });

        it("can create multiple credential", function() {
            var u = umc.createUser();
            u.set("username", "bob");
            var c1 = u.createCredential();
            var c2 = u.createCredential();
            assert.instanceOf(c1, Credential);
            assert.instanceOf(c2, Credential);
            assert.notEqual(c1, c2);
        });
    });

    describe("getCredentials", function() {
        it("returns empty list if none exist", function() {
            var u = umc.createUser();
            u.set("username", "bob");
            u.getCredentials()
                .then((creds) => {
                    assert.isArray(creds);
                    assert.strictEqual(creds.length, 0);
                });
        });

        it("returns single credential", function() {
            var u = umc.createUser();
            u.set("username", "bob");
            var c = u.createCredential();
            assert.instanceOf(c, Credential);
            var username = c.get("username");
            assert.strictEqual(username, "bob");
        });

        it("returns multiple credentials");
    });
});

describe("credential", function() {
    var umc;
    beforeEach(function() {
        umc = new UdsMongoComponent(dummyComponentManager);
        umc.init();
    });

    afterEach(function() {
        return helpers.dbDeleteAll("users", {})
            .then(() => {
                umc.shutdown();
            });
    });

    it("can update credential");
    it("can set credential attributes");
});