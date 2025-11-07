require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

// Resolve connection settings from environment variables with helpful fallbacks
const uri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
const dbName = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || process.env.DB_NAME;

if (!uri) {
    throw new Error("MONGODB_URI is not set. Please define MONGODB_URI in backend/.env");
}
if (!dbName) {
    throw new Error("MONGODB_DB_NAME is not set. Please define MONGODB_DB_NAME in backend/.env");
}

// Create a new MongoClient
const client = new MongoClient(uri, {
    serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
    }
});

// Connection variable to store the database connection
let db;

// Connect to MongoDB
async function connect() {
    try {
        // Connect the client to the server
        await client.connect();

        // Get the database
        db = client.db(dbName);

        console.log("Successfully connected to MongoDB!");
        return db;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

// Get the database connection
function getDb() {
    if (!db) {
        throw new Error("Database not initialized. Call connect() first.");
    }
    return db;
}

// Close the connection
async function close() {
    try {
        await client.close();
        console.log("MongoDB connection closed.");
    } catch (error) {
        console.error("Error closing MongoDB connection:", error);
        throw error;
    }
}

// Helper function to convert string IDs to ObjectId
function toObjectId(id) {
    try {
        return new ObjectId(id);
    } catch (error) {
        throw new Error(`Invalid ObjectId: ${id}`);
    }
}

module.exports = {
    connect,
    getDb,
    close,
    ObjectId,
    toObjectId
};