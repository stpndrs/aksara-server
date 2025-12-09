/**
 * @file Router for retrieving data from the Question Bank.
 * @module QuestionBankRoutes
 * @requires module:AuthMiddleware - All routes require authentication.
 */
const express = require('express')
const router = express.Router()
const questionBankController = require('../controllers/questionBankController')
const middleware = require('./middleware')

/**
 * @route GET /v1/questions
 * @description Retrieves questions from the bank, filtered by level and method.
 * @access Private
 * @param {string} level - Query parameter for question level.
 * @param {string} method - Query parameter for learning method.
 */
router.get('/', questionBankController.index)
module.exports = router