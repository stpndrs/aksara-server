/**
 * @file Global Authentication Middleware.
 * @module AuthMiddleware
 */
const jwt = require('jsonwebtoken');
const { getToken } = require('../helpers/authHelpers');
const clientSecret = process.env.JWT_SECRET;

/**
 * Middleware function to verify JWT token validity and attach user payload to the request.
 *
 * @function middleware
 * @memberof module:AuthMiddleware
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Callback to pass control to the next handler.
 * @returns {void | object} - Passes control via `next()` or sends a 401 JSON response.
 */
const middleware = (req, res, next) => {
    const token = getToken(req); // Ambil token pakai helper

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, clientSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid Token" });
    }
};

module.exports = middleware;