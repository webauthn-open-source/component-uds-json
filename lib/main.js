var Component = require("component-class");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
var log;

module.exports = class UdsMongoComponent extends Component {
    constructor(cm) {
        super(cm);

        this.addDependency("logger");
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
        this.collection = this.database.collection("users");
    }

    create(record) {
        if (typeof record !== "object") {
            throw new TypeError("expected 'record' to be of type object, got " + typeof record);
        }

        return promiseCall(this.collection, "insert", record, {})
            .then((res) => {
                return res[0];
            });
    }

    createOrUpdate(selector, record) {
        if (typeof selector !== "object") {
            throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
        }

        if (typeof record !== "object") {
            throw new TypeError("expected 'record' to be of type object, got " + typeof record);
        }

        return promiseCall(this.collection, "update", selector, {
            "$set": record
        }, {
            upsert: true
        });
    }

    update(selector, record) {
        if (typeof selector !== "object") {
            throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
        }

        if (typeof record !== "object") {
            throw new TypeError("expected 'record' to be of type object, got " + typeof record);
        }

        return promiseCall(this.collection, "update", selector, {
            "$set": record
        }, {
            upsert: false
        });
    }

    get(selector) {
        if (typeof selector !== "object") {
            throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
        }

        return promiseCall(this.collection, "findOne", selector);
    }

    find() {

    }

    deleteOne(selector) {
        if (typeof selector !== "object") {
            throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
        }

        return promiseCall(this.collection, "remove", selector, {
            single: true
        });
    }

    deleteAll(selector) {
        if (typeof selector !== "object") {
            throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
        }

        return promiseCall(this.collection, "remove", selector, {
            single: false
        });
        // return Promise.resolve(1);
    }

    requireField(fieldList) {
        // we're schema-less, so always return true
        return true;
    }

    addMap(fieldName, internalMap) {

    }

    shutdown() {
        // log.debug ("Shutting down UdsMongoComponent.");
        return promiseCall(this.database, "close");
    }
};

function promiseCall(ctx, prop, ...args) {
    return new Promise((resolve, reject) => {
        let fn = ctx[prop];
        if (!fn) throw new TypeError ("function not found: " + prop);
        fn.call(ctx, ...args, function(err, res) {
            if (err) return reject(err);
            return resolve(res);
        });
    });
}