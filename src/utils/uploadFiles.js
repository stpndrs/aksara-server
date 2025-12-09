const multer = require('multer')
const path = require('path')

/**
 * @file Utility module for configuring Multer to handle file uploads (specifically images).
 * @module UploadFileUtil
 */

// ----------------------------------------------------------------------
// STORAGE CONFIGURATION (Helper)
// ----------------------------------------------------------------------

/**
 * Creates a Multer disk storage configuration with a custom filename generator.
 *
 * @private
 * @function storage
 * @memberof module:UploadFileUtil
 * @param {string} destination - The directory path where the file should be saved.
 * @returns {multer.StorageEngine} The Multer storage configuration object.
 */
const storage = (destination) => multer.diskStorage({
    destination: destination,
    filename: (req, file, cb) => {
        // Filename format: fieldname_timestamp.ext
        return cb(null, `${file.fieldname}_${Date.now() + file.originalname}${path.extname(file.originalname)}`)
    }
})

// ----------------------------------------------------------------------
// UPLOAD MIDDLEWARE (Main Export)
// ----------------------------------------------------------------------

/**
 * Configures and returns a Multer middleware function to handle multiple file uploads (`.array('images')`).
 *
 * @function uploadFiles
 * @memberof module:UploadFileUtil
 * @param {string} destination - The target directory path for saving the uploaded files.
 * @returns {multer.Multer} Multer middleware configured for array upload with specific limits and filters.
 * @property {number} limits.fileSize - Maximum file size set to 2MB (2 * 1024 * 1024 bytes).
 * @property {function} fileFilter - Only allows 'image/png', 'image/jpg', and 'image/jpeg' MIME types.
 * @property {string} arrayName - The expected field name in the request body is 'images'.
 */
const uploadFiles = (destination) => multer({
    storage: storage(destination),
    limits: {
        fileSize: 20 * 1024 * 1024, // 5mb
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
            cb(null, true)
        } else {
            cb(null, false)
            return 'Only .png, .jpg and .jpeg format allowed!'
        }
    },
    onError: function (err, next) {
        return console.log('error', err)
        next(err)
    }
}).array('images')

module.exports = uploadFiles