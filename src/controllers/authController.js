const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { errorHandling } = require('../helpers/errorHandling');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

/**
 * Controller module for user authentication.
 * @module AuthController
 */

// ----------------------------------------------------------------------
// LOGIN
// ----------------------------------------------------------------------

/**
 * Handles user login authentication.
 * * @async
 * @function login
 * @memberof module:AuthController
 * @param {object} req - Express request object containing email and password.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Returns JSON with JWT token on success.
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate required fields
        if (!username || !password) {
            return res.status(422).json({
                success: false,
                message: "Validation error",
                errors: {
                    username: !username ? 'Username is required' : null,
                    password: !password ? 'Password is required' : null,
                }
            });
        }

        // Find user (findOne is more efficient than find for single record)
        const userEmail = await userModel.findOne({ email: username });
        const userUsername = await userModel.findOne({ username: username });
        let user
        if (userEmail) user = userEmail
        else user = userUsername
        // Check user existence and password match
        if (!user || !(await bcryptjs.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { userId: user._id, fullName: user.fullName, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            token: token
        });

    } catch (error) {
        return errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// REGISTER
// ----------------------------------------------------------------------

/**
 * Handles new user registration.
 * * @async
 * @function register
 * @memberof module:AuthController
 * @param {object} req - Express request object containing user details.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Returns JSON with JWT token on success.
 */
exports.register = async (req, res) => {
    try {
        const { fullName, username, email, phone, password } = req.body;

        // Check for existing user (Unique email per role)
        const existingEmail = await userModel.findOne({ email: email });
        const existingUsername = await userModel.findOne({ email: email });

        if (existingEmail) {
            // Return 409 Conflict for duplicate resource
            return res.status(409).json({
                success: false,
                message: "Registration error",
                errors: { email: 'Email sudah pernah digunakkan' }
            });
        }

        if (existingUsername) {
            // Return 409 Conflict for duplicate resource
            return res.status(409).json({
                success: false,
                message: "Registration error",
                errors: { username: 'Username sudah pernah digunakkan' }
            });
        }

        let role = 1

        const newUser = new userModel({
            fullName,
            username,
            email,
            phone,
            password,
            role
        });

        // Validate Mongoose schema constraints before hashing
        await newUser.validate();

        newUser.password = await bcryptjs.hash(password, 10);
        await newUser.save();

        const token = jwt.sign(
            { userId: newUser._id, fullName: newUser.fullName, role: newUser.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token: token
        });

    } catch (error) {
        return errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// LOGOUT
// ----------------------------------------------------------------------

/**
 * Handles user logout.
 * Note: In JWT (stateless), actual logout is handled client-side by clearing the token.
 * * @function logout
 * @memberof module:AuthController
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.logout = (req, res) => {
    return res.status(200).json({
        success: true,
        message: "User logged out successfully"
    });
};