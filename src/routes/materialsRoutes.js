/**
 * @file Router for managing learning materials.
 * @module MaterialsRoutes
 * @requires module:AuthMiddleware - All routes require authentication.
 */
const express = require('express')
const router = express.Router()
const path = require('path');
const materialsController = require('../controllers/materialsController')
const middleware = require('./middleware')
const uploadFiles = require('../utils/uploadFiles')

/**
 * @route GET /v1/materials
 * @description Retrieves a list of materials assigned to a specific child ID.
 * @access Private
 * @param {string} children - Query parameter for the child ID.
 */
router.get('/', materialsController.index)

/**
 * @route POST /v1/materials
 * @description Creates and uploads a new learning material (Teacher action). Includes file upload middleware.
 * @access Private
 * @middleware uploadFiles - Handles file upload to `storage/material`.
 */
router.post('/', uploadFiles(path.join(__dirname, '../../storage/material')), materialsController.store)

/**
 * @route GET /v1/materials/:id
 * @description Returning detail data of the material
 * @access Private
 * @param {string} id - Route parameter for the material ID
 */
router.get('/:id', materialsController.show)

/**
 * @route PUT /v1/materials/:id
 * @description Updated a new material (Teacher Action). Includes file upload middleware.
 * @access Private
 * @param {string} id - Route parameter for the material ID
 * @middleware uploadFiles - Handles file upload to `storage/material`.
 */
router.put('/:id', uploadFiles(path.join(__dirname, '../../storage/material')), materialsController.update)

/**
 * @route POST /v1/materials/:id
 * @description Visibility the material
 * @access Private
 * @param {string} id - Route parameter for the material ID
 * @
 */
router.post('/:id', materialsController.visibilty)

/**
 * @route GET /v1/materials/*
 * @description Serves static files (images) from the materials storage folder.
 * @access Public (Static File Access)
*/
router.use('/', express.static('storage/material'))

router.post('/create/generate', materialsController.generate)

module.exports = router