function dbCreate(umc, tableName, record) {
    validateTable(tableName);

    if (typeof record !== "object") {
        throw new TypeError("expected 'record' to be of type object, got " + typeof record);
    }

    var collection = umc.database.collection(tableName);

    return promiseCall(collection, "insert", record, {})
        .then((res) => {
            return res[0];
        });
}

function dbCreateOrUpdate(umc, tableName, selector, record) {
    validateTable(tableName);

    if (typeof record !== "object") {
        throw new TypeError("expected 'record' to be of type object, got " + typeof record);
    }

    var collection = umc.database.collection(tableName);

    return promiseCall(collection, "update", selector, {
        "$set": record
    }, {
        upsert: true
    });
}

function dbUpdate(umc, tableName, selector, record) {
    validateTable(tableName);

    if (typeof selector !== "object") {
        throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
    }

    if (typeof record !== "object") {
        throw new TypeError("expected 'record' to be of type object, got " + typeof record);
    }

    var collection = umc.database.collection(tableName);

    return promiseCall(collection, "update", selector, {
        "$set": record
    }, {
        upsert: false
    });
}

function dbGet(umc, tableName, selector) {
    validateTable(tableName);

    if (typeof selector !== "object") {
        throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
    }

    var collection = umc.database.collection(tableName);

    return promiseCall(collection, "findOne", selector);
}

function dbFind(umc, tableName, selector) {
    validateTable(tableName);

    if (typeof selector !== "object") {
        throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
    }

    var collection = umc.database.collection(tableName);

    return promiseCall(collection, "find", selector)
        .then((cursor) => {
            return promiseCall(cursor, "toArray");
        });
}

function dbDeleteOne(umc, tableName, selector) {
    validateTable(tableName);

    if (typeof selector !== "object") {
        throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
    }

    var collection = umc.database.collection(tableName);

    return promiseCall(collection, "remove", selector, {
        single: true
    });
}

function dbDeleteAll(umc, tableName, selector) {
    selector = selector || {};
    validateTable(tableName);

    if (typeof selector !== "object") {
        throw new TypeError("expected 'selector' to be of type object, got " + typeof record);
    }

    var collection = umc.database.collection(tableName);

    return promiseCall(collection, "remove", selector, {
        single: false
    });
}

function validateTable(tableName) {
    var validTables = [
        "users",
        "credentials"
    ];

    if (typeof tableName !== "string") {
        throw new TypeError("expected 'tableName' to be of type string, got " + typeof tableName);
    }

    if (!validTables.includes(tableName)) {
        throw new TypeError(`${tableName} is not a valid table name`);
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

module.exports = {
    dbCreate: dbCreate,
    dbCreateOrUpdate: dbCreateOrUpdate,
    dbUpdate: dbUpdate,
    dbGet: dbGet,
    dbFind: dbFind,
    dbDeleteOne: dbDeleteOne,
    dbDeleteAll: dbDeleteAll
};