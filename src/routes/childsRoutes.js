/**
 * @file Router for managing student records and Parent/Teacher relationships.
 * @module ChildsRoutes
 * @requires module:AuthMiddleware - All routes require authentication.
 */
const express = require('express')
const router = express.Router()
const childsController = require('../controllers/childsController')
const middleware = require('./middleware')

/**
 * @route GET /v1/childs
 * @description Retrieves a list of children associated with the authenticated user (Parent or Teacher).
 * @access Private
 */
router.get('/', childsController.index)

/**
 * @route POST /v1/childs
 * @description Creates a new student record and links it to the authenticated user (Parent).
 * @access Private
 */
router.post('/', childsController.store)

/**
 * @route POST /v1/childs/insert
 * @description Allows a Teacher to link an existing student record using the student's unique code.
 * @access Private
 */
router.post('/insert', childsController.insert)

/**
 * @route GET /v1/childs/:id
 * @description Retrieves the detailed profile, exercises, and materials of a student using their unique code.
 * @access Private
 */
router.get('/:id', childsController.show)

/**
 * @route PUT /v1/childs/:id
 * @description Retrieves the detailed profile, exercises, and materials of a student using their unique code.
 * @access Private
 */
router.put('/:id', childsController.update)

/**
 * @route DELETE /v1/childs/:id
 * @description Handles the soft deletion of a student record and unlinks them from Parent/Teacher.
 * @access Private
 */
router.delete('/:id', childsController.destroy)


module.exports = router