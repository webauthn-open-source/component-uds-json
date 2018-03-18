var Component = require("component-class");
var {
    User,
    Credential
} = require("component-user-class");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
var log;

class UdsMongoComponent extends Component {
    constructor(cm) {
        super(cm);

        this.addDependency("logger");

        this.credentialCollection = "credentials";
        this.userCollection = "users";

        // TODO: validateTables in the requests below

    }

    init() {
        var logger = this.cm.get("logger");
        if (logger === undefined) {
            throw new Error("logger component not found");
        }
        log = logger.create("UdsMongoComponent");

        log.debug("Starting UdsMongoComponent ...");

        this.tingoInit();
    }

    tingoInit() {
        // create a storage directory
        var dataDir = fs.realpathSync(path.resolve(this.cm.dataDir || "."));
        this.storageDir = path.join(dataDir, "user-data");
        mkdirp.sync(this.storageDir);
        // log.debug ("storage directory:", this.storageDir);

        // create database
        var TingoDb = require("tingodb")().Db;
        this.database = new TingoDb(this.storageDir, {});
    }

    createUser() {
        return new User(this);
    }

    findUsers(selector) {
        if (typeof selector !== "object") {
            throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
        }

        var collection = this.database.collection(this.userCollection);

        return promiseCall(collection, "find", selector)
            .then((ret) => promiseCall(ret, "toArray"))
            .then((users) => {
                // for every user that was found, convert it into a User object
                var ret = users.map((user) => {
                    let u = new User(this);
                    for (let key of Object.keys(user)) {
                        if (key === "_id") continue; // don't add internal mongo key
                        u.initialize(key, user[key]);
                    }
                    return u;
                });
                return ret;
            });
    }

    saveUser(user) {
        if (!(user instanceof User)) {
            throw new TypeError("expected 'user' parameter to be an instance of the 'User' class");
        }

        var fullJournal = user.getJournal({
            type: "object",
            update: true,
            delete: true,
            init: false
        });

        var selector = {
            username: fullJournal.username
        };

        var collection = this.database.collection(this.userCollection);
        return promiseCall(collection, "update", selector, {
            "$set": fullJournal
        }, {
            upsert: true
        });
    }

    destroyUser(user) {
        if (!(user instanceof User)) {
            throw new TypeError("expected 'user' parameter to be of type User class");
        }

        var collection = this.database.collection(this.userCollection);

        var selector = {
            username: user.get("username")
        };
        return promiseCall(collection, "remove", selector);
    }

    findCredentials(selector) {
        if (typeof selector !== "object") {
            throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
        }

        if (selector instanceof User) {
            selector = {
                username: selector.get("username")
            };
        }

        var collection = this.database.collection(this.credentialCollection);

        return promiseCall(collection, "find", selector)
            .then((ret) => promiseCall(ret, "toArray"))
            .then((creds) => {
                // for every user that was found, convert it into a Credential object
                var ret = creds.map((cred) => {
                    let u = new Credential(this);
                    for (let key of Object.keys(cred)) {
                        u.initialize(key, cred[key]);
                    }
                    return u;
                });
                return ret;
            });
    }

    createCredential() {
        return new Credential(this);
    }

    saveCredential(cred) {
        if (!(cred instanceof Credential)) {
            throw new TypeError("expected 'user' parameter to be an instance of the 'User' class");
        }

        var collection = this.database.collection(this.credentialCollection);
        var fullJournal;

        if (!cred.get("_id")) {
            fullJournal = cred.getJournal({
                type: "object",
                update: true,
                delete: true,
                init: true
            });

            return promiseCall(collection, "save", fullJournal)
                .then((newCred) => {
                    cred.set("_id", cred.id);
                    return newCred;
                });
        }

        fullJournal = cred.getJournal({
            type: "object",
            update: true,
            delete: true,
            init: false
        });
        var selector = {
            _id: cred.get("_id"),
            username: cred.get("username")
        };
        return promiseCall(collection, "update", selector, {
            "$set": fullJournal
        }, {
            upsert: true
        });

    }

    destroyCredential(cred) {
        if (!(cred instanceof Credential)) {
            throw new TypeError("expected 'cred' parameter to be of type Credential class");
        }

        var collection = this.database.collection(this.credentialCollection);

        var _id = cred.get("_id");

        if (_id) {
            var selector = {
                _id: _id,
                username: cred.get("username")
            };
            return promiseCall(collection, "remove", selector);
        }
    }

    shutdown() {
        // log.debug ("Shutting down UdsMongoComponent.");
        if (this.database) promiseCall(this.database, "close");
        else return Promise.resolve();
    }
}

function promiseCall(ctx, prop, ...args) {
    return new Promise((resolve, reject) => {
        let fn = ctx[prop];
        if (!fn) throw new TypeError("function not found: " + prop);
        fn.call(ctx, ...args, function(err, res) {
            if (err) return reject(err);
            return resolve(res);
        });
    });
}

module.exports = UdsMongoComponent;