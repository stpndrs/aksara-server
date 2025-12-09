/**
 * @file Main API Router. Aggregates all version 1 (v1) module routes and applies global middleware.
 * @module MainRouter
 */
const express = require('express')
const router = express.Router()
const authRoutes = require('./authRoutes')
const dashboardRoutes = require('./dashboardRoutes')
const childsRoutes = require('./childsRoutes')
const exercisesRoutes = require('./exercisesRoutes')
const questionBankRoutes = require('./questionBankRoutes')
const materialsRoutes = require('./materialsRoutes')
const middleware = require('./middleware')

/**
 * @namespace v1
 * @description Base path for Version 1 of the API.
 */

// Route: /v1/auth
router.use('/v1/auth', authRoutes)

// Route: /v1/dashboard
router.use('/v1/dashboard', middleware, dashboardRoutes)

// Route: /v1/childs
router.use('/v1/childs', middleware, childsRoutes)

// Route: /v1/exercise
router.use('/v1/exercise', middleware, exercisesRoutes)

// Route: /v1/questions
router.use('/v1/questions', middleware, questionBankRoutes)

// Route: /v1/materials
router.use('/v1/materials', middleware, materialsRoutes)

// Route: /v1/image/material
router.use('/v1/image/material', express.static('storage/material'))

// Route: /v1/image/exercise
router.use('/v1/image/exercise', express.static('storage/exercise'))

// Route: /v1/image/exercise
router.use('/v1/image/samples', express.static('storage/samples'))

module.exports = router