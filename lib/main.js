var Component = require("component-class");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
var log;

module.exports = class UdsJsonComponent extends Component {
    constructor(cm) {
        super(cm);

        this.addDependency("logger");
    }

    init() {
        var logger = this.cm.get("logger");
        if (logger === undefined) {
            throw new Error("logger component not found");
        }
        log = logger.create("UdsJsonComponent");

        log.debug ("Starting UdsJsonComponent ...");

        // create a storage directory
        var dataDir = fs.realpathSync(path.resolve(this.cm.dataDir || "."));
        this.storageDir = path.join(dataDir, "uds-json");
        mkdirp.sync(this.storageDir);
        log.debug ("storage directory:", this.storageDir);
    }

    shutdown() {
        // log.debug ("Shutting down UdsJsonComponent.");
    }
};