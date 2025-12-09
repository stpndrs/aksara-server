/**
 * @file Router for user authentication endpoints (Login, Register, Logout).
 * @module AuthRoutes
 */
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const middleware = require('./middleware')

/**
 * @route POST /v1/auth/login
 * @description Authenticates a user and returns a JWT token.
 * @access Public
 */
router.post('/login', authController.login)

/**
 * @route POST /v1/auth/register
 * @description Registers a new user account.
 * @access Public
 */
router.post('/register', authController.register)

/**
 * @route POST /v1/auth/logout
 * @description Invalidates the current JWT session (requires token).
 * @access Private (Requires Middleware)
 */
router.post('/logout', middleware, authController.logout)

module.exports = router