const { errorHandling } = require("../helpers/errorHandling");
const userModel = require("../models/userModel");
const materialModel = require("../models/materialModel");
const exerciseModel = require("../models/exerciseModel");

/**
 * Controller module for Child (Student) management.
 * Handles CRUD operations and relationship linking for Parents and Teachers.
 *
 * Roles:
 * 1: Teacher
 * 2: Parent
 * 3: Child
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
                const parent = await userModel.findById(childData.parentsId);
                const objectData = childData.toObject();

                // Sanitize: Remove internal arrays and role info
                const { childIds, deleted, role, ...child } = objectData;

                let finalChildData = {
                    child,
                    teacherName: teacher ? teacher.fullName : '-',
                    parentName: parent ? parent.fullName : '-'
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
        // Authorization: Only Parents (2) can create children
        if (req.user.role != 2) {
            return res.status(403).json({ success: false, message: 'Forbidden access' });
        }

        const newChild = new userModel({
            fullName: req.body.fullName,
            isScreening: req.body.isScreening,
            level: req.body.level,
        });

        newChild.role = 3; // Set role to Child

        // Generate unique random code (used for Teacher linking)
        function generateRandomString(length) {
            return Array.from({ length }, () => Math.random().toString(36)[2]).join('').toUpperCase();
        }
        newChild.code = generateRandomString(5);

        // Manual field validation
        await newChild.validate(['fullName', 'isScreening', 'level']);

        // Link Parent to Child
        const findParent = await userModel.findById(req.user.userId);
        newChild.parentsId = findParent._id;

        // Save Child
        await newChild.save({ validateBeforeSave: false });

        // Link Child to Parent
        findParent.childIds.push(newChild.id);
        await findParent.save();

        res.status(201).json({
            success: true,
            message: "Successfully added new child",
            data: newChild
        });

    } catch (error) {
        errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// INSERT: Link Existing Child (Teacher Only)
// ----------------------------------------------------------------------

/**
 * Links an existing child to a Teacher using the child's unique code.
 * Access restricted to Teachers (Role 1).
 *
 * @async
 * @function insert
 * @param {object} req - Express request object.
 * @param {string} req.body.code - The unique 5-char code of the child.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Responds with success message.
 */
exports.insert = async (req, res) => {
    try {
        // Authorization: Only Teachers (1) can insert students
        if (req.user.role != 1) {
            return res.status(403).json({ success: false, message: 'Forbidden access' });
        }

        const teacher = await userModel.findOne({ _id: req.user.userId, role: 1 });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher not found' });
        }

        if (!req.body.code) {
            return res.status(422).json({
                success: false,
                message: 'Validation error',
                errors: { code: 'Code is required' }
            });
        }

        const code = req.body.code;

        // Find child by Unique Code
        const child = await userModel.findOne({ code: code });
        if (!child) {
            return res.status(400).json({ success: false, message: 'Child not found' });
        }

        // Logic Check: Is child already linked?
        if (child.teacherId) {
            if (child.teacherId.equals(teacher._id)) {
                return res.status(400).json({ success: false, message: 'Child has already been added by you' });
            }
            return res.status(400).json({ success: false, message: 'Child already has a teacher' });
        }

        // Perform Linking
        teacher.childIds.push(child._id);
        child.teacherId = teacher._id;

        await teacher.save({ validateBeforeSave: false });
        await child.save({ validateBeforeSave: false });

        return res.status(201).json({
            success: true,
            message: 'Successfully added student'
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
        if (req.user.role != 2) {
            return res.status(403).json({ success: false, message: 'Forbidden access' });
        }

        const child = await userModel.findById(req.params.id);
        if (!child) return res.status(400).json({ success: false, message: 'Child not found' });

        child.fullName = req.body.fullName;
        child.isScreening = req.body.isScreening;
        child.level = req.body.level;

        // Validate specific fields
        await child.validate(['fullName', 'isScreening', 'level']);

        await child.save({ new: true, validateBeforeSave: false });

        res.status(201).json({
            success: true,
            message: "Child successfully updated",
            data: child
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
        const parent = await userModel.findOne({ _id: child.parentsId, role: 2 });
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
        const { childIds, deleted, role, ...childData } = childObject;

        const parentObject = parent ? parent.toObject() : {};
        const { deleted: parentDeleted, role: parentRole, ...parentData } = parentObject;

        const teacherObject = teacher ? teacher.toObject() : {};
        const { deleted: teacherDeleted, role: teacherRole, ...teacherData } = teacherObject;

        const data = {
            child: childData,
            teacher: teacherData,
            parent: parentData,
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

        // Case 1: Teacher is removing student from class
        if (req.user.role === 1) {
            const teacher = await userModel.findById(child.teacherId);
            if (teacher) {
                teacher.childIds.pull(child._id);
                await teacher.save();
            }
            // Unlink teacher from child
            await userModel.findByIdAndUpdate(child._id, { teacherId: null });
        }
        // Case 2: Parent is deleting their child
        else if (req.user.role === 2) {
            // Delete from parent
            const parent = await userModel.findById(child.parentsId);
            if (parent) {
                parent.childIds.pull(child._id);
                await parent.save();
            }
            // Delete from teacher
            const teacher = await userModel.findById(child.teacherId);
            if (teacher) {
                teacher.childIds.pull(child._id);
                await teacher.save();
            }
            await userModel.findByIdAndUpdate(child._id, { teacherId: null });

            // Perform Soft Delete
            await userModel.delete({ _id: child._id });
        }

        res.status(200).json({
            success: true,
            message: "Child successfully deleted/unlinked",
        });
    } catch (error) {
        errorHandling(error, req, res);
    }
};