const { errorHandling } = require("../helpers/errorHandling");
const bcryptjs = require('bcryptjs');
const userModel = require("../models/userModel");
const materialModel = require("../models/materialModel");
const exerciseModel = require("../models/exerciseModel");

/**
 * Controller module for Child (Student) management.
 * Handles CRUD operations and relationship linking for Parents and Teachers.
 *
 * Roles:
 * 1: Teacher
 * 2: Child
 *
 * @module ChildsController
 */

// ----------------------------------------------------------------------
// INDEX: List Children
// ----------------------------------------------------------------------

/**
 * Retrieves a list of children associated with the authenticated Parent.
 *
 * @async
 * @function index
 * @param {object} req - Express request object. Expects `req.user.userId`.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Responds with an array of child objects including parent names.
 */
exports.index = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.userId);
        const childs = [];

        // Iterate through the parent's array of child IDs
        for (const childId of user.childIds) {
            let childData = await userModel.findById(childId);

            if (childData) {
                // Fetch parent details to append the name
                const teacher = await userModel.findById(childData.teacherId);
                const objectData = childData.toObject();

                // Sanitize: Remove internal arrays and role info
                const { childIds, deleted, role, password, ...child } = objectData;

                let finalChildData = {
                    child,
                    teacherName: teacher ? teacher.fullName : '-',
                };
                childs.push(finalChildData);
            }
        }

        res.status(200).json({
            success: true,
            message: "Successfully received data",
            data: { childs: childs }
        });
    } catch (error) {
        errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// STORE: Create Child (Parent Only)
// ----------------------------------------------------------------------

/**
 * Creates a new child account.
 * Access restricted to Parents (Role 2). Generates a unique 5-char code for the child.
 *
 * @async
 * @function store
 * @param {object} req - Express request object.
 * @param {string} req.body.fullName - Child's full name.
 * @param {boolean} req.body.isScreening - Dyslexia screening status.
 * @param {string} req.body.level - Current learning level.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Responds with the created child object.
 */
exports.store = async (req, res) => {
    try {
        const teacher = await userModel.findById(req.user.userId)
        if (!teacher) return res.status(400).json({ success: false, message: 'Teacher not found' })

        const username = req.body.fullName.toLowerCase().split(' ').join('')
        const generatedPassword = await bcryptjs.hash(username, 10)
        const newChild = new userModel({
            fullName: req.body.fullName,
            username: username,
            password: generatedPassword,
            deafness: req.body.deafness,
            dateOfBirth: req.body.dateOfBirth,
            parent: {
                fullName: req.body.parentName,
            },
            teacherId: teacher._id
        });

        newChild.role = 2; // Set role to Child

        // Manual field validation
        await newChild.validate(['fullName', 'username', 'deafness', 'dateOfBirth', 'parent.fullName']);

        // Save Child
        await newChild.save({ validateBeforeSave: false });

        // update teacher data
        teacher.childIds.push(newChild._id);
        await teacher.save({ validateBeforeSave: false })

        const { childIds, deleted, role, password, ...childObj } = newChild.toObject();

        res.status(201).json({
            success: true,
            message: "Successfully added new child",
            data: childObj
        });

    } catch (error) {
        errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// UPDATE: Edit Child (Parent Only)
// ----------------------------------------------------------------------

/**
 * Updates a child's profile information.
 * Access restricted to Parents (Role 2).
 *
 * @async
 * @function update
 * @param {object} req - Express request object.
 * @param {string} req.params.id - The Child's ID.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Responds with updated child data.
 */
exports.update = async (req, res) => {
    try {
        const child = await userModel.findById(req.params.id);
        if (!child) return res.status(400).json({ success: false, message: 'Child not found' });

        child.fullName = req.body.fullName;
        child.deafness = req.body.deafness;
        child.dateOfBirth = req.body.dateOfBirth;
        child.parent.fullName = req.body.parentName;
        child.parent.phone = req.body.parentPhone;
        child.parent.address = req.body.parentAddress;
        child.parent.work = req.body.parentWork;

        // Validate specific fields
        await child.validate([
            'fullName',
            'deafness',
            'dateOfBirth',
            'parent.fullName',
        ]);

        await child.save({ new: true, validateBeforeSave: false });

        const { childIds, deleted, role, password, ...childObj } = child.toObject();

        res.status(201).json({
            success: true,
            message: "Child successfully updated",
            data: childObj
        });
    } catch (error) {
        errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// SHOW: Detailed View
// ----------------------------------------------------------------------

/**
 * Retrieves full details of a specific child, including exercises and materials.
 * Transforms numeric method IDs into human-readable strings.
 *
 * @async
 * @function show
 * @param {object} req - Express request object. Expects `req.params.id`.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Responds with aggregated child profile, exercises, and materials.
 */
exports.show = async (req, res) => {
    try {
        const child = await userModel.findById(req.params.id);
        if (!child) return res.status(400).json({ success: false, message: 'Child not found' });

        // Fetch related data
        const teacher = await userModel.findOne({ _id: child.teacherId, role: 1 });
        const exercises = await exerciseModel.find({ childrenId: child._id });
        const materials = await materialModel.find({ childrenId: child._id });

        // Helper: Map numeric method ID to string
        function switchMethod(a) {
            switch (a) {
                case 1: return "Mendengar audio";
                case 2: return "Menulis ulang";
                case 3: return "Membaca";
                case 4: return "Mengurutkan kata";
                case 5: return "Menebak cepat";
                default: return "Other";
            }
        }

        // Transform Exercises: remove heavy 'questions' array and format method
        const transformedExercises = exercises.map((exercise) => {
            const exerciseObject = exercise.toObject();
            const { questions, ...restOfExercise } = exerciseObject;
            return {
                ...restOfExercise,
                method: switchMethod(restOfExercise.method)
            };
        });

        // Transform Materials: format method
        const transformedMaterials = materials.map((material) => {
            const materialObject = material.toObject();
            return {
                ...materialObject,
                method: switchMethod(materialObject.method)
            };
        });

        // Data Sanitization
        const childObject = child.toObject();
        const { childIds, deleted, role, password, ...childData } = childObject;

        const teacherObject = teacher ? teacher.toObject() : {};
        const { deleted: teacherDeleted, role: teacherRole, ...teacherData } = teacherObject;
        

        const data = {
            child: childData,
            teacher: teacherData,
            exercises: transformedExercises,
            materials: transformedMaterials,
        };

        return res.status(200).json({ success: true, message: 'Successfully received data', data: data });
    } catch (error) {
        errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// DESTROY: Delete or Unlink
// ----------------------------------------------------------------------

/**
 * Deletes a child account or unlinks them from a teacher.
 * Behavior depends on the role of the requester.
 *
 * - If Teacher (Role 1): Unlinks the child from the teacher's class.
 * - If Parent (Role 2): Unlinks from parent and performs a soft delete on the child account.
 *
 * @async
 * @function destroy
 * @param {object} req - Express request object. Expects `req.params.id`.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Responds with success message.
 */
exports.destroy = async (req, res) => {
    try {
        const child = await userModel.findById(req.params.id);
        if (!child) return res.status(400).json({ success: false, message: 'Child not found' });

        const teacher = await userModel.findById(child.teacherId);
        if (teacher) {
            teacher.childIds.pull(child._id);
            await teacher.save();
        }

        // Perform Soft Delete
        await userModel.delete({ _id: child._id });

        res.status(200).json({
            success: true,
            message: "Child successfully deleted/unlinked",
        });
    } catch (error) {
        errorHandling(error, req, res);
    }
};