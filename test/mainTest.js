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

    describe("object", function() {
        it("can be initialized", function() {
            var ret = umc.init();
            assert.isUndefined(ret);
        });

        it("can be shutdown");
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
                return helpers.dbDeleteAll(umc, "credentials", {});
            })
            .then(() => {
                umc.shutdown();
            });
    });

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

    describe("destroyUser", function() {
        it("deletes user", function() {
            return helpers.dbCreate(umc, "users", {
                    username: "adam"
                })
                .then(() => {
                    return umc.findUsers({
                        username: "adam"
                    });
                })
                .then((users) => {
                    assert.isArray(users);
                    assert.strictEqual(users.length, 1);
                    var user = users[0];
                    return umc.destroyUser(user);
                })
                .then(() => {
                    return umc.findUsers({
                        username: "adam"
                    });
                })
                .then((users) => {
                    assert.isArray(users);
                    assert.strictEqual(users.length, 0);
                });
        });
        it("throws error when user doesn't exist");
        it("does nothing if the user hasn't been committed yet");
    });

    describe("saveUser", function() {
        it("saves to db", function() {
            return umc.findUsers({
                    username: "adam"
                })
                .then((users) => {
                    assert.isArray(users);
                    assert.strictEqual(users.length, 0);
                    var user = umc.createUser();
                    user.set("username", "adam");
                    return umc.saveUser(user);
                })
                .then(() => {
                    return umc.findUsers({
                        username: "adam"
                    });
                })
                .then((users) => {
                    assert.isArray(users);
                    assert.strictEqual(users.length, 1);
                });
        });
        it("can update user");
    });

    describe("User", function() {
        describe("createCredential", function() {
            it("can create credential via uds", function() {
                var c = umc.createCredential();
                assert.instanceOf(c, Credential);
            });

            it("can create credential via user", function() {
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
                return u.getCredentials()
                    .then((creds) => {
                        assert.isArray(creds);
                        assert.strictEqual(creds.length, 0);
                    });
            });

            it("returns multiple credentials");
        });
    });

    describe("createCredential", function() {
        it("returns single credential", function() {
            var u = umc.createUser();
            u.set("username", "bob");
            var c = u.createCredential();
            assert.instanceOf(c, Credential);
            var username = c.get("username");
            assert.strictEqual(username, "bob");
        });
    });

    describe("saveCredentials", function() {
        it("saves to db", function() {
            var u = umc.createUser();
            u.set("username", "bob");
            var c = u.createCredential();
            return c.commit()
                .then(() => {
                    return helpers.dbFind(umc, "credentials", {
                        username: "bob"
                    });
                })
                .then((creds) => {
                    assert.isArray(creds);
                    assert.strictEqual(creds.length, 1);
                    var cred = creds[0];
                    assert.strictEqual(cred.username, "bob");
                });
        });

        it("returns all credentials", function() {
            var u = umc.createUser();
            u.set("username", "bob");
            var c1 = u.createCredential();
            c1.set("id", "c1");
            var c2 = u.createCredential();
            c2.set("id", "c2");
            var c3 = u.createCredential();
            c3.set("id", "c3");
            assert.notEqual(c1, c2);
            assert.notEqual(c2, c3);
            assert.notEqual(c1, c3);
            var pList = [
                c1.commit(),
                c2.commit(),
                c3.commit()
            ];
            return Promise.all(pList)
                .then(() => {
                    return helpers.dbFind(umc, "credentials", {
                        username: "bob"
                    });
                })
                .then((creds) => {
                    assert.isArray(creds);
                    assert.strictEqual(creds.length, 3);
                    var ids = creds.map(cred => cred.id);
                    assert(ids.includes("c1"), "has ID c1");
                    assert(ids.includes("c2"), "has ID c2");
                    assert(ids.includes("c3"), "has ID c3");
                });
        });

        it("can update credential");
        it("can set credential attributes");
    });

    describe("findCredentials", function() {
        it("can find credentials associated with user");
        it("can create credential associated with user");
        it("can find credentials using selector");
    });

    describe("deleteCredential", function() {
        it("removes from db", function() {
            var u = umc.createUser();
            u.set("username", "bob");
            var c = u.createCredential();
            return umc.saveCredential(c)
                .then((ret) => {
                    return umc.findCredentials({
                        username: "bob"
                    });
                })
                .then((creds) => {
                    assert.isArray(creds);
                    assert.strictEqual(creds.length, 1);
                    var cred = creds[0];
                    assert.instanceOf(cred, Credential);
                    assert.strictEqual(cred.get("username"), "bob");
                    return umc.destroyCredential(cred);
                })
                .then(() => {
                    return umc.findCredentials({
                        username: "bob"
                    });
                })
                .then((creds) => {
                    assert.isArray(creds);
                    assert.strictEqual(creds.length, 0);
                });
        });
        it("deletes one credential while leaving the rest alone");
        it("does nothing if the credential hasn't been committed yet");
    });
});