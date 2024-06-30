const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

let client;
let db;

async function connectToDatabase() {
    if (!client) {
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db(process.env.DB_NAME);
        console.log('Connected to MongoDB Atlas');
    }
    return db;
}

module.exports = connectToDatabase;
