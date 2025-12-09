/**
 * @file Global error handling utility for Express controllers.
 * @module ErrorHandling
 */

/**
 * Processes and standardizes error responses for Express requests, handling Mongoose validation errors, 
 * duplicate key errors, and generic server errors.
 *
 * @function errorHandling
 * @memberof module:ErrorHandling
 * @param {Error|object} error - The error object caught in the try/catch block.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {void} Sends a JSON response with status 422 (validation) or 500 (server/database).
 */
const errorHandling = (error, req, res) => {
    let errors = {}; // Use object from the start

    console.log(error);

    // Handles E11000 duplicate key error (Mongoose/MongoDB)
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        errors[field] = `The ${field} has already been taken`;
    }

    // Handles Mongoose validation errors (required fields, schema errors)
    if (error.errors) {
        errors = Object.values(error.errors).reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
        }, errors); // Keep unique errors
        return res.status(422).json({ success: false, message: "Validation error", errors: errors });
    }

    // Default server error handling
    res.status(500).json({ success: false, error: error.message });
}

module.exports = { errorHandling }