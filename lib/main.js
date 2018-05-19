var Component = require("component-class");
var {
    User,
    Credential
} = require("component-user-class");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
var log;

/**
 * The component that implements a JSON-based User Data Store (UDS). This component
 * requires Simple Component Manager.
 *
 * **Features:**
 * none.
 *
 * ***Dependencies:**
 * `logger` - uses the logger for recording events and errors
 */
class UdsMongoComponent extends Component {
    constructor(cm) {
        super(cm);

        this.addDependency("logger");

        this.credentialCollection = "credentials";
        this.userCollection = "users";

        // TODO: validateTables in the requests below

    }

    /**
     * Starts up a connection to the User Data Store
     */
    init() {
        var logger = this.cm.get("logger");
        if (logger === undefined) {
            throw new Error("logger component not found");
        }
        log = logger.create("UdsMongoComponent");

        log.debug("Starting UdsMongoComponent ...");

        this.tingoInit();
    }

    /**
     * Initializes TingoDB so that an external database instance isn't required.
     * @private
     */
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

    /**
     * Allocates and returns a new {@link User} that is devoid of any information
     */
    createUser() {
        return new User(this);
    }

    /**
     * Finds a user based on the provided selector.
     * @param {Object} selector A object that describes the User(s) that are being looked up.
     * @return {Promise.<Array.<User>>} A Promise that resolves to the list of users 
     * that was found, or an empty list if no users were found.
     */
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

    /**
     * Commits the specified User to the underlying storage
     * @param {User} user The User to be committed
     * @return {Promise} A Promise that resoves when the User has been succesfully stored,
     * or rejects on error
     */
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

    /**
     * Destroys / deletes the specified User
     * @param {User} The User to be destroyed / deleted.
     * @return {Promise} A Promise that resolves when the User has been deleted, or rejects
     * on error
     */
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

    /**
     * Finds the specified Credential(s)
     * @param {Object} selector The description of the Credentials to find.
     * @return {Promise.<Array.<Credential>>} A Promise that resolves to an Array of
     * Credentials that match the `selector`, or an empty Array if no matching Credentials
     * were found.
     */
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

    /**
     * Allocates and returns a new (empty) Credential
     */
    createCredential() {
        return new Credential(this);
    }

    /**
     * Saves the specified Credential to the UDS
     * @param {Credential} The Credential to be saved
     * @return {Promise} A promise that resolves when the Credential has successfully been
     * committed, or rejects on failure.
     */
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

    /**
     * Destroys / deletes the specified Credential
     * @param {Credential} cred The Credential to destroy / delete
     * @return {Promise} A Promise that resolves when the Credential has been successfully
     * deleted, or rejects on error.
     */
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

    /**
     * Gracefully shuts down the User Data Store (if it has been started)
     */
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