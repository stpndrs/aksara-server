/**
 * @file Router for managing and submitting exercises.
 * @module ExercisesRoutes
 * @requires module:AuthMiddleware - All routes require authentication.
 */
const express = require('express')
const router = express.Router()
const exerciseController = require('../controllers/exerciseController')
const middleware = require('./middleware')

/**
 * @route GET /v1/exercise
 * @description Retrieves a list of exercises filtered by a specific child ID.
 * @access Private
 * @param {string} children - Query parameter for the child ID.
 */
router.get('/', exerciseController.index)

/**
 * @route POST /v1/exercise
 * @description Creates and assigns a new exercise to a student (Teacher action).
 * @access Private
 */
router.post('/', exerciseController.storeExercise)

/**
 * @route POST /v1/exercise/quiz
 * @description Creates and assigns a new exercise to a student (Teacher action).
 * @access Private
 */
router.post('/quiz', exerciseController.storeExerciseQuiz)

/**
 * @route GET /v1/exercise/:id
 * @description Retrieves details for a specific exercise ID.
 * @access Private
 */
router.get('/:id', exerciseController.show)

/**
 * @route GET /v1/exercise/:id/quiz/:quizId
 * @description Retrieves details for a specific exercise ID.
 * @access Private
 */
router.get('/:id/quiz/:quizId', exerciseController.quiz)

/**
 * @route PUT /v1/exercise/:id
 * @description Retrieves details for a specific exercise ID.
 * @access Private
 */
router.put('/:id', exerciseController.updateExercise)

/**
 * @route PUT /v1/exercise/:id/quiz/:quizId
 * @description Retrieves details for a specific exercise ID.
 * @access Private
 */
router.put('/:id/quiz/:quizId', exerciseController.updateExerciseQuiz)

/**
 * @route POST /v1/exercise/history
 * @description To initial the history data before used to save the answer, exercise point, and attitude point.
 * @access Private
 */
// router.post('/history', exerciseController.history)

/**
 * @route POST /v1/exercise/answer
 * @description Submits and processes a child's answers, performs AI transcription, and calculates scores.
 * @access Private
 */
router.post('/answer', exerciseController.answer)

/**
 * @route POST /v1/exercise/attitude
 * @description Submits the attitude point of the child while during the exercise.
 * @access Private
 */
router.post('/attitude', exerciseController.attitude)

/**
 * @route POST /v1/exercise/:id
 * @description Visibility the exercise
 * @access Private
 * @param {string} id - Route parameter for the exercise ID
 */
router.post('/:id/quiz/:quizId/visibility', exerciseController.visibilty)


router.post('/generate', exerciseController.generate)

module.exports = router