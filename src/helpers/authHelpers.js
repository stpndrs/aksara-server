const jwt = require('jsonwebtoken')
const clientSecret = process.env.JWT_SECRET

/**
 * @file Utility module for token operations.
 * @module AuthHelpers
 */

/**
 * Extracts the JWT token from the Authorization header of an Express request.
 * Assumes the format is "Bearer <token>".
 *
 * @function getToken
 * @memberof module:AuthHelpers
 * @param {object} req - Express request object.
 * @returns {string|null} The extracted JWT token string, or null if not found or improperly formatted.
 */
const getToken = (req) => {
    const authHeader = req.headers['authorization'] || null
    // Checks for 'Authorization: Bearer <token>' and returns <token>
    const token = authHeader && authHeader.split(' ')[1];
    return token
}

/**
 * Decodes and verifies a JWT token using the client secret.
 *
 * @function decodeToken
 * @memberof module:AuthHelpers
 * @param {string} token - The JWT token string to be verified.
 * @returns {object} The decoded JWT payload.
 * @throws {Error} If the token is invalid, expired, or the secret is incorrect.
 */
const decodeToken = (token) => {
    return jwt.verify(token, clientSecret)
}

module.exports = { getToken, decodeToken }