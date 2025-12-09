const mongoose = require('mongoose');
const MongooseDelete = require('mongoose-delete');

/**
 * @file Mongoose Schema for User data.
 * @module UserModel
 */

/**
 * @typedef {object} User
 * @property {string} fullName - The user's full name. Required.
 * @property {string} email - The user's email address. Must be unique and valid format. Required.
 * @property {string} password - The user's password (hashed). Minimum 6 characters. Required.
 * @property {string} phone - The user's phone number. Minimum 6 characters. Required.
 * @property {number} role - The user's role in the system. Required.
 * * 1: Teacher (Guru)
 * * 2: Parent (Orang Tua)
 * * 3: Student (Siswa)
 * @property {boolean} [isScreening] - Indicates if the student has undergone the screening process. Required only if role is 3.
 * @property {number} [level] - The student's dyslexia level, required only if `isScreening` is true.
 * @property {string} [code] - Unique enrollment code for students, used by teachers to add them. Sparse unique index.
 * @property {mongoose.Types.ObjectId[]} [childIds] - Array of ObjectIDs referring to associated students (used by Role 1 and 2).
 * @property {mongoose.Types.ObjectId} [parentsId] - ObjectID reference to the parent (used by Role 3).
 * @property {mongoose.Types.ObjectId} [teacherId] - ObjectID reference to the teacher (used by Role 3).
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 * @property {Date} [deletedAt] - Timestamp of soft deletion (due to MongooseDelete plugin).
 */
const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Nama lengkap wajib diisi"],
        // unique: true
    },
    email: {
        type: String,
        match: [/.+\@.+\..+/, 'Email harus valid'],
        required: [true, "Email wajib diisi"],
        unique: [true, 'Email sudah pernah digunakkan'],
        sparse: true // for unique while filled
    },
    username: {
        type: String,
        required: [true, "Username wajib diisi"],
        unique: [true, 'Username sudah pernah digunakkan'],
        sparse: true // for unique while filled
    },
    password: {
        type: String,
        required: [true, "Password wajib diisi"],
        minlength: [6, "Password minimal 6 karater"],
        // select: false
    },
    phone: {
        type: String,
        required: [true, "Nomor telepon wajib diisi"],
        minlength: [6, "Nomor telepon minimal 6 karater"]
    },
    /**
     * 1 = Guru
     * 2 = Siswa
     */
    role: {
        type: Number,
        required: [true, "Role wajib dipilih"]
    },

    /**
     * Child
     */
    deafness: {
        type: String,
        required: [
            function () {
                return this.role === 2
            },
            "Ketunaan wajib diisi",
        ],
    },
    dateOfBirth: {
        type: Date,
        required: [
            function () {
                return this.role === 2
            },
            "Tanggal lahir wajib diisi"
        ]
    },
    parent: {
        fullName: {
            type: String,
            required: [
                function () {
                    return this.role === 2
                },
                "Nama Orang Tua wajib diisi"
            ]
        },
        phone: {
            type: String,
            required: [
                function () {
                    return this.role === 2
                },
                "Nomor telepon wajib diisi"
            ]
        },
        address: {
            type: String,
            required: [
                function () {
                    return this.role === 2
                },
                "Alamat wajib diisi"
            ]
        },
        work: {
            type: String,
        },
    },
    childIds: [{
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User' // <-- Menunjuk ke model 'User' itu sendiri juga
    }],
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User'
    }
}, {
    timestamps: true,
});

UserSchema.plugin(MongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true
})

module.exports = mongoose.model('User', UserSchema);
