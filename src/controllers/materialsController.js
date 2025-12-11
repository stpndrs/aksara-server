const materialModel = require("../models/materialModel")
const userModel = require("../models/userModel")
const aiService = require("../services/aiService");
const { errorHandling } = require('../helpers/errorHandling')
const { materialPrompt } = require('../helpers/promptHelpers');
const removeFile = require("../utils/removeFile")
const path = require('path');

/**
 * Controller module for managing learning materials (assigned by Teacher).
 * @module MaterialController
 */

// ----------------------------------------------------------------------
// INDEX
// ----------------------------------------------------------------------

/**
 * Retrieves a list of learning materials assigned to a specific child.
 *
 * @async
 * @function index
 * @memberof module:MaterialController
 * @param {object} req - Express request object.
 * @param {string} req.query.children - The ID of the child (Role 3) whose materials are being requested.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response containing an array of material objects.
 * @returns {object} data - Array of material data objects.
 * @throws {422} If the `children` query parameter is missing.
 * @throws {400} If the specified child ID does not correspond to an existing student (Role 3).
 * @throws {500} If a server or database error occurs.
 */
exports.index = async (req, res) => {
    try {
        const childrenId = req.query?.children

        // Validation
        if (!childrenId) {
            return res.status(422).json({ success: false, message: 'Validation error', errors: { children: 'Harap memilih siswa terlebih dahulu' } })
        }

        // Check if child 
        if (!await userModel.findOne({ _id: childrenId, role: 2 })) return res.status(400).json({ success: false, message: 'Siswa tidak ditemukan' })

        const query = {
            childrenId: childrenId,
        }

        // for find with hidden true or false
        if (req.query?.hidden)
            // find data where hidden true, false, or all data
            query.isHidden = req.query.hidden

        // Find materials by childID
        const data = await materialModel.find(query)

        return res.status(200).json({
            success: true,
            message: 'Successfully received data',
            data: data
        })
    } catch (error) {
        errorHandling(error, req, res)
    }
}

// ----------------------------------------------------------------------
// STORE (Create New Material)
// ----------------------------------------------------------------------

/**
 * Creates and stores a new learning material, assigning it to a specific child.
 * Handles file uploads (images) and optional external links.
 *
 * @async
 * @function store
 * @memberof module:MaterialController
 * @param {object} req - Express request object.
 * @param {string} req.body.childrenId - The ID of the child to assign the material to.
 * @param {string} req.body.title - Title of the material.
 * @param {string} req.body.description - Description of the material.
 * @param {number} req.body.level - Level for the material (e.g., 1, 2, 3).
 * @param {number} req.body.method - Method code for the material (e.g., 1=audio, 2=writing, etc.).
 * @param {string} [req.body.videoUrl] - Optional external videoUrl for the material.
 * @param {Array<object>} [req.images] - Array of uploaded images (images) handled by multer.
 * @returns {Promise<void>} - Sends a JSON response with the newly created material document.
 * @returns {object} data - The newly created material document.
 * @throws {400} If the specified child is not found.
 * @throws {422} If Mongoose validation fails (e.g., missing required body fields).
 * @throws {500} If a server or database error occurs.
 */
exports.store = async (req, res) => {
    try {
        const newMaterial = new materialModel({
            childrenId: req.body.childrenId,
            title: req.body.title,
            description: req.body.description,
            method: req.body.method,
            content: req.body.content,
            readedText: req.body.readedText,
        })

        // Check if child 
        if (!await userModel.findOne({ _id: req.body.childrenId, role: 2 })) return res.status(400).json({ success: false, message: 'Siswa tidak ditemukan' })

        // validation
        await newMaterial.validate()

        // save images path
        if (!req.body.isGenerated) {
            if (req.files?.length > 0) {
                newMaterial.images = []
                req.files.forEach(element => {
                    // Assuming `element.filename` is provided by multer
                    const path = `storage/material/${element.filename}`
                    newMaterial.images.push(path)
                });
            }
        } else {
            if (req.body.images) {
                if (req.body.images.length > 0) {
                    req.body.images.forEach(element => {
                        const path = `storage/material/${element}`
                        newMaterial.images.push(path)
                    });
                }
            }
        }

        if (req.body.videoUrl) newMaterial.videoUrl = req.body.videoUrl

        await newMaterial.save()

        return res.status(201).json({
            success: true,
            message: 'Successfully create data',
            data: newMaterial
        })
    } catch (error) {
        errorHandling(error, req, res)
    }
}

// ----------------------------------------------------------------------
// SHOW (Detail of the Material)
// ----------------------------------------------------------------------

/**
 * Retrieves a single material document by ID
 * 
 * @async
 * @function show
 * @memberof module:MaterialController
 * @param {object} req - Express request object. Contains the exercise ID in `req.params.id`
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sens a JSON response with the material details
 * @returns {object} data - Material document with images and/or videoUrl tutorial
 * @throws {400} If the material data is not found.
 * @throws {500} If a server or database error occurs.
 */
exports.show = async (req, res) => {
    try {
        const data = await materialModel.findById(req.params.id)
        const dataObject = data.toObject();

        if (dataObject.images && Array.isArray(dataObject.images)) {
            dataObject.images = dataObject.images.map(imagePath => {
                const filename = path.basename(imagePath);
                return `image/material/${filename}`;
            });
        }

        if (!data) return res.status(400).json({ success: false, message: 'Materi tidak ditemukan' })

        return res.json({ success: true, message: 'Success retrieved data', data: dataObject })
    } catch (error) {
        errorHandling(error, req, res)
    }
}

// ----------------------------------------------------------------------
// UPDATE (Update material by material id's)
// ----------------------------------------------------------------------
/**
 * Handles the update of a material data
 * * @async
 * @function update
 * @memberof module:MaterialController
 * @param {object} req - Express request object. 
 * @param {string} req.body.childrenId - The ID of the child to assign the material to.
 * @param {string} req.body.title - Title of the material.
 * @param {string} req.body.description - Description of the material.
 * @param {number} req.body.level - Level for the material (e.g., 1, 2, 3).
 * @param {number} req.body.method - Method code for the material (e.g., 1=audio, 2=writing, etc.).
 * @param {string} [req.body.videoUrl] - Optional external videoUrl for the material.
 * @param {Array<object>} [req.images] - Array of uploaded images (images) handled by multer.
 * @returns {promise<void>} - Sends a JSON response with the newly edited material document.
 * @returns {object} data - The newly edited material document.
 * @throws {400} If the specified child is not found.
 * @throws {422} If Mongoose validation fails (e.g., missing required body fields).
 * @throws {500} If a server or database error occurs.
*/
exports.update = async (req, res) => {
    try {

        const { childrenId, title, description, method, content, readedText } = req.body

        const data = await materialModel.findById(req.params.id)

        // Check if data
        if (!data) return res.status(400).json({ success: false, message: "Material not found" });

        // Check if child 
        if (!await userModel.findOne({ _id: req.body.childrenId, role: 2 })) return res.status(400).json({ success: false, message: 'Siswa tidak ditemukan' })

        data.childrenId = childrenId
        data.title = title
        data.description = description
        data.method = method
        data.content = content
        data.readedText = readedText

        if (req.body.videoUrl) data.videoUrl = req.body.videoUrl

        // save images path
        if (req.files && req.files.length > 0) {
            data.images.forEach(path => {
                removeFile(path)
            });

            data.images = []
            req.files.forEach(element => {
                console.log(element);
                // Assuming `element.filename` is provided by multer
                const path = `storage/material/${element.filename}`
                data.images.push(path)
            });
        }

        const updatedData = await data.save()

        res.status(200).json({
            success: true,
            message: 'Materi berhasil diupdate!',
            data: updatedData
        })
    } catch (error) {
        errorHandling(error, req, res)
    }
}

// ----------------------------------------------------------------------
// VISIBILITY (For Teacher to updating status about hidden (show/hide the material))
// ----------------------------------------------------------------------
/**
 * Handles the hidden status about the material
 * * @async
 * @function update
 * @memberof module:MaterialController
 * @param {object} req - Express request object. 
 * @returns {promise<void>} - Sends a JSON response with the status of the material.
 * @returns {object} data - The status of the material.
 * @throws {400} If the specified child is not found.]
 * @throws {403} If the role are not teacher.
 * @throws {500} If a server or database error occurs.
*/
exports.visibilty = async (req, res) => {
    if (req.user.role != 1) {
        return res.status(403).json({ success: false, message: 'Forbidden access' })
    }

    const data = await materialModel.findById(req.params.id)

    if (!data) return res.status(400).json({ success: false, message: 'Material not found' })

    data.isHidden = !data.isHidden
    await data.save({ validateBeforeSave: false })

    res.status(200).json({ success: true, message: 'Status berhasil disimpan', data: { isHidden: data.isHidden } })
}

// Generate exercise
exports.generate = async (req, res) => {
    try {
        const { difficulty, method, description } = req.body;
        const listImages = [
            'anjing.png',
            'buku.png',
            'gunting.png',
            'kucing.png',
            'kursi.png',
            'meja.png',
            'mobil.png',
            'motor.png',
            'pensil.png',
            'pesawat.png',
            'singa.png',
            'ular.png',
        ]

        const prompt = materialPrompt({
            difficulty,
            method,
            listImages,
            description
        });

        const model = "gpt-oss:20b-cloud" // sweet spot for now
        const result = await aiService.generateLLM({
            prompt,
            model: model,
            retries: 3
        });

        return res.status(200).json({ success: true, message: 'Success generating materials', data: { material: result } })

    } catch (err) {
        errorHandling(err, req, res)
    }
}