var Component = require("component-class");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
var log;

class Op {
    constructor(op, fieldName, value) {
        if (typeof op !== "string") {
            throw new TypeError("exepected 'op' to be string, got " + typeof op);
        }

        if (typeof fieldName !== "string") {
            throw new TypeError("exepected 'fieldName' to be string, got " + typeof fieldName);
        }

        this.op = op;
        this.fieldName = fieldName;
        this.value = value;
    }
}

class Table {
    constructor(uds) {
        if (!(uds instanceof Component)) {
            throw new TypeError("expected UDS component");
        }

        this.uds = uds;
        this.journal = [];
    }

    createSchema(schema) {
        this.schema = schema;
    }

    get(fieldName) {
        if (typeof fieldName !== "string") {
            throw new TypeError("exepected 'fieldName' to be string, got " + typeof fieldName);
        }

        // find the last instance 'op' on 'fieldName'
        var obj;
        for (let i = (this.journal.length - 1); i >= 0; i--) {
            obj = this.journal[i];
            if (obj.fieldName === fieldName) break;
        }

        return obj.value;
    }

    set(fieldName, value) {
        var newOp = new Op("set", fieldName, value);
        this.journal.push(newOp);
    }

    initialize(fieldName, value) {
        var newOp = new Op("init", fieldName, value);
        this.journal.push(newOp);
    }

    delete(fieldName, value) {
        var newOp = new Op("delete", fieldName, value);
        this.journal.push(newOp);
    }

    /**
     * Returns the journal in the format requested by `opts`
     * @param  {Object}  [opts]                 The options for the journal that is returned
     * @param  {Type}    [opts.type="object"]   The format to return. Options are "map", "object", or "array".
     * @param  {Boolean} [opts.last=true]       Include only the last recorded operation. Only applies if type is "array".
     * @param  {Boolean} [opts.update=true]     Include updates in the journal
     * @param  {Boolean} [opts.delete=true]     Include deletes in the journal
     * @param  {Boolean} [opts.init=true]       Include initial values in the journal
     * @param  {Boolean} [opts.getTables=false] Only get `Table` types in the results; does not include any `Tables` if not set.
     * @return {Map|Object|Array}               As specified by the `opts.type` parameter
     */
    getJournal(opts) {
        opts = opts || {};
        var type = opts.type || "object";
        var last = (opts.last !== undefined) ? opts.last : true;
        var update = (opts.update !== undefined) ? opts.update : true;
        var del = (opts.delete !== undefined) ? opts.delete : true;
        var init = (opts.init !== undefined) ? opts.init : true;
        var tables = (opts.getTables !== undefined) ? opts.getTables : false;

        if (!last && opts.type !== "array") {
            throw new TypeError ("the `last` option may only be `false` if the `type` is \"array\"");
        }

        var journal;
        if (last) journal = compressJournal(this.journal);
        journal = journal
            .filter((op) => {
                // console.log ("op", op);
                if (del && op.op === "delete") return true;
                if (update && op.op === "set") return true;
                if (init && op.op === "init") return true;
            });
            // .filter((op) => {
            //     if (tables && op.value instanceof Table) return true;
            //     else if (!tables && !(op.value instanceof Table)) return true;
            //     return false;
            // });
        // console.log ("filtered journal", journal);

        if (type === "object") return createJournalObject(journal);
        else if (type === "map") return createJournalMap(journal);
        else if (type === "array") return createJournalArray(journal);
        throw new Error ("unknown type: " + type);

        function compressJournal(journal) {
            // console.log("journal", journal);
            var ret = [];
            var alreadyFound = new Set();
            for (let i = journal.length - 1; i >= 0; i--) {
                let key = journal[i].fieldName;

                if (alreadyFound.has(key)) continue;

                alreadyFound.add(key);
                ret.unshift(journal[i]);
            }

            // console.log("compressed journal", ret);
            return ret;
        }

        function createJournalObject(journal) {
            var ret = {};
            journal.forEach((entry) => {
                let key = entry.fieldName,
                    op = entry.op,
                    value = entry.value;
                if (!tables && value instanceof Table) return;
                switch (op) {
                    case "set":
                        if (update) ret[key] = value;
                        break;
                    case "delete":
                        if (del) ret[key] = undefined;
                        break;
                    case "init":
                        if (init) ret[key] = value;
                        break;
                    default:
                        throw new Error("Unknown operation: " + op);
                }
            });

            return ret;
        }

        function createJournalMap() {

        }

        function createJournalArray() {

        }
    }

    // journalToObject() {
    //     var ret = {};
    //     this.journal.forEach((entry) => {
    //         let key = entry.fieldName, op = entry.op, value = entry.value;
    //         if (value instanceof Table) return;
    //         switch(op) {
    //             case "set":
    //                 ret[key] = value;
    //                 break;
    //             case "delete":
    //                 ret[key] = undefined;
    //                 break;
    //             case "init":
    //                 ret[key] = value;
    //                 break;
    //             default:
    //                 throw new Error ("Unknown operation: " + op);
    //         }
    //     });

    //     return ret;
    // }

    // getUpdates() {
    //     var ret = {};
    //     this.journal.forEach((entry) => {
    //         let key = entry.fieldName, op = entry.op, value = entry.value;
    //         if (value instanceof Table) return;
    //         switch(op) {
    //             case "set":
    //                 ret[key] = value;
    //                 break;
    //             case "delete":
    //                 ret[key] = undefined;
    //                 break;
    //             case "init":
    //                 break;
    //             default:
    //                 throw new Error ("Unknown operation: " + op);
    //         }
    //     });

    //     return ret;
    // }

    commit() {
        // virtual interface to be implemented by child classes
        throw new Error("not implemented!");
    }
}

class User extends Table {
    constructor(uds) {
        super(uds);

        this.createSchema(); // TODO
    }

    createCredential() {
        return new Credential(this.uds);
    }

    findCredentials() {

    }

    deleteCredential() {

    }

    saveCredentials() {

    }

    commit() {
        return this.uds.saveUser(this);
    }
}

class Credential extends Table {
    constructor(uds) {
        super(uds);
    }

    commit() {
        return this.uds.saveCredential(this);
    }
}

module.exports = class UdsMongoComponent extends Component {
    constructor(cm) {
        super(cm);

        this.addDependency("logger");

        // TODO: validateTables in the requests below
        this.validTables = [
            "users",
            "credentials"
        ];
    }

    validateTable(tableName) {
        if (typeof tableName !== "string") {
            throw new TypeError("expected 'tableName' to be of type string, got " + typeof tableName);
        }

        if (!this.validTables.includes(tableName)) {
            throw new TypeError (`${tableName} is not a valid table name`);
        }
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
        return this.find("users", selector)
            .then((ret) => {
                return promiseCall(ret, "toArray");
            })
            .then((users) => {
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
    // deleteUser()
    saveUser(user) {
        if (!(user instanceof User)) {
            throw new TypeError("expected 'user' parameter to be an instance of the 'User' class");
        }

        // var j = user.getUpdates();
        // this.createOrUpdate("users", j);
    }

    create(tableName, record) {
        this.validateTable(tableName);

        if (typeof record !== "object") {
            throw new TypeError("expected 'record' to be of type object, got " + typeof record);
        }

        var collection = this.database.collection(tableName);

        return promiseCall(collection, "insert", record, {})
            .then((res) => {
                return res[0];
            });
    }

    // createOrUpdate(selector, record) {
    //     if (typeof selector !== "object") {
    //         throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
    //     }

    //     if (typeof record !== "object") {
    //         throw new TypeError("expected 'record' to be of type object, got " + typeof record);
    //     }

    //     return promiseCall(this.collection, "update", selector, {
    //         "$set": record
    //     }, {
    //         upsert: true
    //     });
    // }

    // update(selector, record) {
    //     if (typeof selector !== "object") {
    //         throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
    //     }

    //     if (typeof record !== "object") {
    //         throw new TypeError("expected 'record' to be of type object, got " + typeof record);
    //     }

    //     return promiseCall(this.collection, "update", selector, {
    //         "$set": record
    //     }, {
    //         upsert: false
    //     });
    // }

    // get(selector) {
    //     if (typeof selector !== "object") {
    //         throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
    //     }

    //     return promiseCall(this.collection, "findOne", selector);
    // }

    find(tableName, selector) {
        this.validateTable(tableName);

        if (typeof selector !== "object") {
            throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
        }

        var collection = this.database.collection(tableName);

        return promiseCall(collection, "find", selector);
    }

    // deleteOne(selector) {
    //     if (typeof selector !== "object") {
    //         throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
    //     }

    //     return promiseCall(this.collection, "remove", selector, {
    //         single: true
    //     });
    // }

    deleteAll(tableName, selector) {
        this.validateTable(tableName);

        if (typeof selector !== "object") {
            throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
        }

        var collection = this.database.collection(tableName);

        return promiseCall(collection, "remove", selector, {
            single: false
        });
    }

    shutdown() {
        // log.debug ("Shutting down UdsMongoComponent.");
        if (this.database) promiseCall(this.database, "close");
        else return Promise.resolve();
    }
};

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