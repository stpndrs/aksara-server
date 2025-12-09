const mongoose = require('mongoose')

/**
 * @file Mongoose Schema for Learning Materials assigned to students.
 * @module MaterialModel
 */

/**
 * @typedef {object} Material
 * @property {mongoose.Types.ObjectId} childrenId - ObjectID reference to the student to whom the material is assigned.
 * @property {mongoose.Types.ObjectId} [teacherId] - ObjectID reference to the teacher who assigned the material.
 * @property {string} title - The title of the learning material. Required.
 * @property {number} level - The difficulty level of the material. Required.
 * @property {number} method - The method/type of learning exercise. Required.
 * * 1: Audio/Listening
 * * 2: Writing/Rewriting
 * * 3: Reading Aloud
 * * 4: Word Ordering
 * * 5: Rapid Naming
 * @property {string} [description] - Optional description of the material.
 * @property {string[]} [images] - Array of paths to associated image files.
 * @property {string} [link] - Optional external link/URL for the material.
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 */
const MaterialSchema = new mongoose.Schema({
    childrenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // simpan id guru, supaya kalau data anak dihapus dari data guru, disini kelihatan guru siapa yang tambahkan materinya
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: [true, 'Judul wajib diisi']
    },
    level: {
        type: Number,
        required: [true, 'Level wajib diisi']
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
        required: [true, 'Pilih metode terlebih dahulu']
    },
    description: {
        type: String,
        required: false
    },
    images: {
        type: Array,
        required: false,
    },
    videoUrl: {
        type: String,
        required: false,
    },
    content: {
        type: String,
        required: false,
    },
    readedText: {
        type: String,
        required: false,
    },
    isHidden: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Material', MaterialSchema)