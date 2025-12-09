const md5 = require("md5")
const userModel = require("../models/userModel")
const exerciseModel = require("../models/exerciseModel")
const { errorHandling } = require("../helpers/errorHandling")
const questionBankModel = require("../models/questionBankModel")

/**
 * Controller module for managing the central Question Bank.
 * @module QuestionBankController
 */

// ----------------------------------------------------------------------
// INDEX
// ----------------------------------------------------------------------

/**
 * Retrieves a list of questions from the Question Bank filtered by level and learning method.
 *
 * @async
 * @function index
 * @memberof module:QuestionBankController
 * @param {object} req - Express request object.
 * @param {string} req.query.level - The required educational level for filtering questions.
 * @param {string} req.query.method - The required learning method/type for filtering questions.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response containing an array of question bank objects.
 * @returns {object} data - Array of question bank data objects matching the filter criteria.
 * @throws {422} If the `level` or `method` query parameters are missing (Validation Error).
 * @throws {500} If a server or database error occurs during data retrieval.
 */
exports.index = async (req, res) => {
    try {
        // Validation
        const errors = {}
        if (!req.query?.level) errors.level = 'Harap memilih level'
        if (!req.query?.method || req.query?.method == 'null') errors.method = 'Harap memilih metode pembelajaran'
        if (Object.keys(errors).length > 0) {
            // Jika ada, kirim satu respons berisi semua error
            return res.status(422).json({
                success: false,
                message: 'Validation error',
                errors: errors // Kirim semua error yang terkumpul
            });
        }

        // Find data
        const data = await questionBankModel.find({ level: req.query.level, method: req.query.method });
        data.map(d => {
            if (d.question.type == 'path') {
                d.question.value = 'image/exercise/' + d.question.value.split('/')[2]
            }
            return d
        })

        return res.status(200).json({ // Mengubah 201 menjadi 200 karena ini adalah operasi GET/read data.
            success: true,
            message: 'Successfully received data',
            data: data
        })
    } catch (error) {
        errorHandling(error, req, res)
    }
}