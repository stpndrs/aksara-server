const mongoose = require('mongoose')

/**
 * @file Mongoose Schema for Exercise assignments and results.
 * @module ExerciseModel
 */

/**
 * @typedef {object} ExerciseAnswer
 * @property {object} answer
 * @property {string} answer.file - Path or Base64 content of the child's recorded answer file (audio/image). Required.
 * @property {string} [answer.text] - Transcribed text from the file content (processed by AI).
 * @property {string} duration - Time taken to answer the question. Required.
 * @property {Date} [timeOpened] - Timestamp when the question was opened.
 * @property {Date} [timeAnswered] - Timestamp when the answer was submitted.
 * @property {string} [similarityPoint] - Calculated similarity score/point for this specific answer.
 */

/**
 * @typedef {object} ExerciseQuestion
 * @property {string} code - MD5 hash code for identifying the question (links to QuestionBank). Required.
 * @property {object} question
 * @property {string} question.type - Type of question value ('Path' or 'Text'). Required.
 * @property {string} question.value - The content/value of the question itself. Required.
 * @property {string} key - The correct answer key. Required.
 * @property {ExerciseAnswer[]} answers - Array of submission attempts for this question.
 */

/**
 * @typedef {object} Exercise
 * @property {mongoose.Types.ObjectId} childrenId - ObjectID reference to the student assigned this exercise.
 * @property {mongoose.Types.ObjectId} [teacherId] - ObjectID reference to the teacher who assigned the exercise.
 * @property {string} name - Name of the exercise assignment. Required.
 * @property {string} [description] - Optional description of the exercise.
 * @property {number} method - The method/type of learning exercise. Required.
 * * 1: Audio/Listening
 * * 2: Writing/Rewriting
 * * 3: Reading Aloud
 * * 4: Word Ordering
 * * 5: Rapid Naming
 * * 6: Numeric
 * @property {ExerciseQuestion[]} questions - Array of questions included in this exercise.
 * @property {string} [point] - The calculated total final score for the exercise.
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 */
const ExerciseSchema = new mongoose.Schema({
    childrenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // simpan id guru, supaya kalau data anak dihapus dari data guru, disini kelihatan guru siapa yang tambahkan latihannya
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: [true, 'Nama wajib diisi']
    },
    description: {
        type: String,
        required: false
    },
    /**
     * 1 = audio -> save to image (paper text)
     * 2 = writing -> save to image (paper text)
     * 3 = reading -> save to audio
     * 4 = random text from one sentence -> save to text (random by express)
     * 5 = rapid naming object and color -> save to audio (tap tap)
     */
    quiz: [{
        id: {
            type: String
        },
        name: {
            type: String,
            required: [true, 'Nama wajib diisi']
        },
        description: {
            type: String,
            required: false
        },
        questions: [{
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
        }],
        answers: [{
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'exercise'
            },
            answer: {
                file: {
                    type: String,
                    required: true
                },
                text: {
                    type: String,
                    required: false
                }
            },
            // Waktu soal dibuka - waktu soal dijawab
            duration: {
                type: String,
                required: true
            },
            timeOpened: {
                type: Date
            },
            timeAnswered: {
                type: Date
            },
            similarityPoint: {
                type: String,
            },
        }],
        quizPoint: {
            type: String
        },
        // Nilai Sikap
        attitudePoint: {
            note: {
                type: String
            },
            point: Number
        },
        date: {
            type: Date
        },
        isHidden: {
            type: Boolean,
            default: false
        }
    }],
}, {
    timestamps: true
})


module.exports = mongoose.model('Exercise', ExerciseSchema)