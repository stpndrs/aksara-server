const mongoose = require('mongoose')

/**
 * @file Mongoose Schema for the central Question Bank.
 * @module QuestionBankModel
 */

/**
 * @typedef {object} QuestionBank
 * @property {number} level - The difficulty level of the question. Required.
 * @property {number} method - The method/type of learning exercise this question applies to. Required.
 * * 1: Audio/Listening
 * * 2: Writing/Rewriting
 * * 3: Reading Aloud
 * * 4: Word Ordering
 * * 5: Rapid Naming
 * @property {string} code - MD5 hash code for unique identification of the question. Required.
 * @property {object} question
 * @property {string} question.type - Type of question value ('Path' or 'Text'). Required.
 * @property {string} question.value - The content/value of the question itself. Required.
 * @property {string} key - The correct answer key. Required.
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 */
const QuestionBankSchema = new mongoose.Schema({
    level: {
        type: Number,
        required: true
    },
    /**
     * 1 = audio -> save to image (paper text)
     * 2 = writing -> save to image (paper text)
     * 3 = reading -> save to audio
     * 4 = random text from one sentence -> save to text (random by express)
     * 5 = rapid naming object and color -> save to audio (tap tap)
     */
    method: {
        type: Number,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    question: {
        /**
         * Path, or text
         */
        type: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    },
    // Key answer
    key: {
        type: String,
        required: true
    },
}, {
    timestamps: true
})


module.exports = mongoose.model('QuestionBank', QuestionBankSchema)