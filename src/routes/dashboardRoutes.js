/**
 * @file Router for user authentication endpoints (Login, Register, Logout).
 * @module AuthRoutes
 */
const express = require('express')
const router = express.Router()
const dashboardController = require('../controllers/dashboardController')
const middleware = require('./middleware')

/**
 * @route GET /v1/dashboard
 * @description Returned the statistic data.
 * @access Public
 */
router.get('/', dashboardController.index)

module.exports = router