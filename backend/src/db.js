const { MongoClient } = require("mongodb");
const config = require("./config");

let connectPromise = null;

function getDb() {
  if (!config.mongo.uri) {
    return Promise.reject(new Error("MONGODB_URI is not set"));
  }
  if (!connectPromise) {
    const client = new MongoClient(config.mongo.uri);
    connectPromise = client.connect().then((c) => c.db(config.mongo.dbName));
  }
  return connectPromise;
}

module.exports = { getDb };
