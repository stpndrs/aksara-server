const mongoose = require('mongoose');

/**
 * @file Database Connection Configuration.
 * @description Establishes the connection to the MongoDB database using environment variables and handles connection status logging.
 * @module DBConfig
 */

/**
 * @global
 * @constant {string} host - Hostname or IP address for the MongoDB server, retrieved from environment variable `DB_HOST`.
 */
const host = process.env.DB_HOST

/**
 * @global
 * @constant {string} name - Database name for the connection, retrieved from environment variable `DB_NAME`.
 */
const name = process.env.DB_NAME

/**
 * @global
 * @constant {string} atlasHost - Host name for the connection, retrieved from environment variable `DB_ATLAS_HOST`.
 */
const atlasHost = process.env.DB_ATLAS_HOST

/**
 * @global
 * @constant {string} atlasUsername - Username for the connection, retrieved from environment variable `DB_ATLAS_USERNAME`.
 */
const atlasUsername = process.env.DB_ATLAS_USERNAME

/**
 * @global
 * @constant {string} atlasPassword - Database password for the connection, retrieved from environment variable `DB_ATLAS_PASSWORD`.
 */
const atlasPassword = process.env.DB_ATLAS_PASSWORD

/**
 * @global
 * @constant {string} atlasDbName - Database name for the connection, retrieved from environment variable `DB_ATLAS_NAME`.
 */
const atlasDbName = process.env.DB_ATLAS_NAME

/**
 * @function connect
 * @memberof module:DBConfig
 * @description Attempts to connect to MongoDB using the constructed connection string.
 * @returns {Promise<void>} Logs "MongoDB connected" on success or the error message on failure.
 */
mongoose
    // Connection string built from environment variables
    .connect(`mongodb://${host}:27017/${name}`, {})
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("Error while connecting to db " + err));

// mongoose
//     // Connection string built from environment variables
//     .connect(`mongodb+srv://${atlasUsername}:${atlasPassword}@${atlasHost}/${atlasDbName}?appName=Cluster0`, {})
//     .then(() => console.log("MongoDB connected"))
//     .catch(err => console.log("Error while connecting to db " + err));