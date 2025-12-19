const fs = require('fs');
const path = require('path');
const md5 = require("md5");
const userModel = require("../models/userModel");
const exerciseModel = require("../models/exerciseModel");
const questionBankModel = require("../models/questionBankModel");
const aiService = require("../services/aiService");
const { errorHandling } = require("../helpers/errorHandling");
const { calculateCharacterMatchScore } = require("../helpers/similarity");
const { exercisePrompt } = require('../helpers/promptHelpers');
const removeFile = require('../utils/removeFile');

/**
 * Controller module for Exercise management.
 * Handles the creation of exercises, quizzes, student answers (AI integration), and teacher grading.
 * * **Roles:**
 * * 1: Teacher (Can create, update, grade)
 * * 2: Parent (Can view index)
 * * 3: Student (Can view detail, submit answers)
 * * @module ExerciseController
 */

// --- Helper Functions ---

const isHexColor = (params) => /^#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})$/.test(params);
const isBase64DataURL = (str) => typeof str === 'string' && /^data:.+;base64,/.test(str);

const saveBase64Image = (base64String) => {
    try {
        const storageDir = path.resolve(__dirname, '..', '..', 'storage', 'exercise');
        if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

        const matches = base64String.match(/^data:(image\/(\w+));base64,(.+)$/);
        if (!matches || matches.length !== 4) return null;

        const filename = `exercise-${Date.now()}-${Math.round(Math.random() * 1E9)}.${matches[2]}`;
        const filePath = path.join(storageDir, filename);
        fs.writeFileSync(filePath, Buffer.from(matches[3], 'base64'));

        return `storage/exercise/${filename}`;
    } catch (error) {
        console.error('Error saving base64 image:', error);
        return null;
    }
};

// ----------------------------------------------------------------------
// INDEX
// ----------------------------------------------------------------------

/**
 * Retrieves a list of exercises assigned to a specific child.
 * * @async
 * @function index
 * @memberof module:ExerciseController
 * @param {object} req - Express request object.
 * @param {string} req.query.children - The ID of the child (Student).
 * @param {object} res - Express response object.
 * @returns {Promise<void>} List of exercise objects.
 * @throws {422} If `children` query param is missing.
 * @throws {400} If Child ID is invalid or not a student.
 */
exports.index = async (req, res) => {
    try {
        const childrenId = req.query?.children;

        if (!childrenId) {
            return res.status(422).json({ success: false, message: 'Validation error', errors: { children: 'Please select the child first' } });
        }

        if (!await userModel.findOne({ _id: childrenId, role: 2 })) {
            return res.status(400).json({ success: false, message: 'Child not found' });
        }

        const data = await exerciseModel.find({ childrenId: childrenId });

        return res.status(200).json({
            success: true,
            message: 'Successfully received data',
            data: data
        });
    } catch (error) {
        errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// STORE (Create)
// ----------------------------------------------------------------------

/**
 * Creates a new Exercise container (Folder).
 * Access: Teacher (Role 1) only.
 * * @async
 * @function storeExercise
 * @memberof module:ExerciseController
 * @param {object} req - Express request object.
 * @param {string} req.body.childrenId - The Child ID to assign.
 * @param {string} req.body.name - Exercise title.
 * @param {string} req.body.description - Exercise description.
 * @returns {Promise<void>} The created exercise document.
 */
exports.storeExercise = async (req, res) => {
    try {
        if (req.user.role !== 1) return res.status(403).json({ success: false, message: 'Forbidden access' });

        const { childrenId, name, description } = req.body;
        const child = await userModel.findById(childrenId);

        if (!child) return res.status(400).json({ success: false, message: 'Child not found' });

        const exercise = new exerciseModel({
            childrenId,
            teacherId: req.user.userId,
            name,
            description
        });

        await exercise.validate(['name', 'childrenId', 'description'])

        await exercise.save({ validateBeforeSave: false });

        return res.status(201).json({
            success: true,
            message: 'Successfully added new exercise',
            data: exercise
        });
    } catch (error) {
        errorHandling(error, req, res);
    }
};

/**
 * Adds a Quiz with questions to an existing Exercise.
 * Automatically handles Base64 image upload and Question Bank checking.
 * * @async
 * @function storeExerciseQuiz
 * @memberof module:ExerciseController
 * @param {object} req - Express request object.
 * @param {string} req.body.exerciseId - Parent Exercise ID.
 * @param {string} req.body.name - Quiz title.
 * @param {Array} req.body.questions - List of questions.
 * @example 
 * // questions example:
 * [
 * { "method": 3, "question": "Apple", "key": "Apple" },
 * { "method": 5, "question": "data:image/png;base64...", "key": "Ball" }
 * ]
 * @returns {Promise<void>} Updated Exercise document.
 */
exports.storeExerciseQuiz = async (req, res) => {
    try {
        if (req.user.role !== 1) return res.status(403).json({ success: false, message: 'Forbidden access' });

        const { exerciseId, name, description, questions } = req.body;

        let errors = {};

        if (!exerciseId) {
            errors.exerciseId = "Exercise ID wajib diisi";
        }

        if (!name || name.trim() === "") {
            errors.name = "Nama Quiz wajib diisi";
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            errors.questions = "Minimal harus ada satu pertanyaan dalam Quiz";
        } else {
            questions.forEach((item, index) => {
                if (!item.method) {
                    errors[`questions[${index}].method`] = `Method pada pertanyaan ke-${index + 1} wajib dipilih`;
                }
                if (!item.question) {
                    errors[`questions[${index}].question`] = `Konten pertanyaan ke-${index + 1} wajib diisi`;
                }
                if (!item.key) {
                    errors[`questions[${index}].key`] = `Kunci jawaban pada pertanyaan ke-${index + 1} wajib diisi`;
                }
            });
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({
                success: false,
                message: 'Validation error',
                errors: errors
            });
        }

        const exercise = await exerciseModel.findById(exerciseId);

        if (!exercise) return res.status(400).json({ success: false, message: 'Exercise not found' });

        // Process questions in parallel to handle file IO and DB checks
        const questionsArr = await Promise.all(questions.map(async (item) => {
            const method = item.method;
            // Determine type: 5 = Image/Hex, others = Text
            const questionType = method == 5 ? (isHexColor(item.question) ? 'hex' : 'path') : 'text';

            let qVal = '';
            let qSave = '';

            if (questionType === 'path') {
                if (isBase64DataURL(item.question)) {
                    const savedPath = saveBase64Image(item.question);
                    qVal = savedPath;
                    qSave = savedPath;
                } else {
                    // Reuse existing path
                    qVal = 'storage/exercise/' + item.question.split('/')[2];
                    qSave = qVal;
                }
            } else {
                qVal = item.question.replace(' ', '').toLowerCase();
                qSave = item.question;
            }

            const k = item.key.replace(' ', '').toLowerCase();
            const code = md5(JSON.stringify({ question: qVal, key: k }));

            // Bank Check
            const qInBank = await questionBankModel.findOne({ code: code });
            if (!qInBank) {
                await new questionBankModel({
                    method, code, key: item.key,
                    question: { type: questionType, value: qVal }
                }).save();
            }

            return {
                method, code, key: item.key,
                question: { type: questionType, value: qSave }
            };
        }));

        exercise.quiz.push({
            name, description,
            date: new Date(),
            questions: questionsArr
        });

        await exercise.save({ validateBeforeSave: false });

        return res.status(201).json({
            success: true,
            message: 'Successfully added new quiz',
            data: exercise
        });
    } catch (error) {
        errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// SHOW (Retrieve Details)
// ----------------------------------------------------------------------

/**
 * Retrieves full Exercise details.
 * **Note:** Hides the `key` (answer) from the response for security.
 * * @async
 * @function show
 * @memberof module:ExerciseController
 * @param {object} req.params.id - Exercise ID.
 * @param {string} [req.query.hidden] - Filter by hidden status ('true'/'false').
 * @returns {Promise<void>} Exercise detail without answer keys.
 */
exports.show = async (req, res) => {
    try {
        const data = await exerciseModel.findById(req.params.id).lean();
        if (!data) return res.status(400).json({ success: false, message: 'Exercise not found' });

        // Transform: Hide Fix Image Paths
        let quizWithImage = data.quiz.map(qu => {
            const questionWithImage = qu.questions.map((q) => {
                if (q.question.type === 'path' && q.question.value) {
                    q.question.value = 'image/exercise/' + q.question.value.split('/')[2];
                }
                return q;
            });
            return { ...qu, questions: questionWithImage };
        });

        if (req.query.hidden != null) {
            const isHiddenFilter = (req.query.hidden === 'true');
            quizWithImage = quizWithImage.filter(d => d.isHidden === isHiddenFilter);
        }

        return res.json({ success: true, message: 'Success retrieved data', data: { ...data, quiz: quizWithImage } });

    } catch (error) {
        errorHandling(error, req, res);
    }
};

/**
 * Retrieves a specific Quiz detail inside an Exercise.
 * **Note:** Hides the `key` (answer).
 * * @async
 * @function quiz
 * @memberof module:ExerciseController
 * @param {object} req.params.id - Exercise ID.
 * @param {object} req.params.quizId - Quiz ID.
 */
exports.quiz = async (req, res) => {
    try {
        const data = await exerciseModel.findById(req.params.id).lean();
        if (!data) return res.status(400).json({ success: false, message: 'Exercise not found' });

        const quiz = data.quiz.find(d => d._id == req.params.quizId);
        if (!quiz) return res.status(400).json({ success: false, message: 'Quiz not found' });

        const questionWithImage = quiz.questions.map((q) => {
            if (q.question.type === 'path' && q.question.value) {
                q.question.value = 'image/exercise/' + q.question.value.split('/')[2];
            }
            return q;
        });

        return res.json({ success: true, message: 'Success retrieved data', data: { ...quiz, questions: questionWithImage } });
    } catch (error) {
        errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// UPDATE
// ----------------------------------------------------------------------

/**
 * Updates Exercise metadata (Name/Description).
 * Access: Teacher only.
 * * @async
 * @function updateExercise
 * @memberof module:ExerciseController
 */
exports.updateExercise = async (req, res) => {
    try {
        if (req.user.role !== 1) return res.status(403).json({ success: false, message: 'Forbidden access' });

        const { name, description } = req.body;

        if (!name) return res.status(422).json({ success: false, errors: { name: 'Masukkan nama terlebih dahulu' } });

        const exercise = await exerciseModel.findById(req.params.id);
        if (!exercise) return res.status(404).json({ success: false, message: 'Exercise not found' });

        exercise.name = name;
        exercise.description = description;

        await exercise.save({ validateBeforeSave: false });

        return res.status(200).json({ success: true, message: 'Exercise successfully updated', data: exercise });
    } catch (error) {
        errorHandling(error, req, res);
    }
};

/**
 * Updates questions within a Quiz.
 * Re-evaluates Question Bank codes for edited questions.
 * * @async
 * @function updateExerciseQuiz
 * @memberof module:ExerciseController
 */
exports.updateExerciseQuiz = async (req, res) => {
    try {
        // 1. Cek Role
        if (req.user.role !== 1) {
            return res.status(403).json({ success: false, message: 'Forbidden access' });
        }

        // 2. Ambil Data dari Params dan Body
        // Asumsi: URL endpoint adalah /exercise/:id/quiz/:quizId

        const { exerciseId, quizId, name, description, questions } = req.body;

        let errors = {};

        // --- VALIDASI INPUT ---

        if (!name || name.trim() === "") {
            errors.name = "Nama Quiz wajib diisi";
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            errors.questions = "Minimal harus ada satu pertanyaan dalam Quiz";
        } else {
            questions.forEach((item, index) => {
                if (!item.method) {
                    errors[`questions[${index}].method`] = `Method pada pertanyaan ke-${index + 1} wajib dipilih`;
                }
                // Validasi konten: Jika method 5 (warna/gambar) atau text biasa
                // Khusus method 5: jika tipe objek warna, value harus ada. Jika gambar, value harus ada.
                if (!item.question) {
                    errors[`questions[${index}].question`] = `Konten pertanyaan ke-${index + 1} wajib diisi`;
                }
                if (!item.key) {
                    errors[`questions[${index}].key`] = `Kunci jawaban pada pertanyaan ke-${index + 1} wajib diisi`;
                }
            });
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({
                success: false,
                message: 'Validation error',
                errors: errors
            });
        }

        // 3. Cari Parent Document (Exercise)
        const exercise = await exerciseModel.findById(exerciseId);
        if (!exercise) {
            return res.status(404).json({ success: false, message: 'Exercise not found' });
        }

        // 4. Cari Sub-document (Quiz) spesifik
        const currentQuiz = exercise.quiz.id(quizId);
        if (!currentQuiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found in this exercise' });
        }

        // 5. Proses Array Pertanyaan (Logic Gambar & Bank Soal)
        const questionsArr = await Promise.all(questions.map(async (item) => {
            console.log(item.question);

            const method = item.method;
            const qParsed = typeof (item.question) == 'object' ? item.question.value : item.question
            // Determine type: 5 = Image/Hex, others = Text
            const questionType = method == 5 ? (isHexColor(qParsed) ? 'hex' : 'path') : 'text';

            let qVal = '';
            let qSave = '';

            if (questionType === 'path') {
                if (isBase64DataURL(qParsed)) {
                    const savedPath = saveBase64Image(qParsed);
                    qVal = savedPath;
                    qSave = savedPath;

                } else {
                    // Reuse existing path
                    qVal = 'storage/exercise/' + qParsed.split('/')[2];
                    qSave = qVal;
                }
            } else {
                qVal = qParsed.replace(' ', '').toLowerCase();
                qSave = qParsed;
            }

            const k = item.key.replace(' ', '').toLowerCase();
            const code = md5(JSON.stringify({ question: qVal, key: k }));

            // Bank Check
            const qInBank = await questionBankModel.findOne({ code: code });
            if (!qInBank) {
                await new questionBankModel({
                    method, code, key: item.key,
                    question: { type: questionType, value: qVal }
                }).save();
            }

            return {
                method, code, key: item.key,
                question: { type: questionType, value: qSave }
            };
        }));

        // 6. Update Field pada Sub-document Quiz
        currentQuiz.name = name;
        currentQuiz.description = description;
        currentQuiz.questions = questionsArr;
        // Opsi: Update tanggal jika diperlukan
        // currentQuiz.date = new Date(); 

        // 7. Simpan Parent Document
        await exercise.save({ validateBeforeSave: false });

        return res.status(200).json({
            success: true,
            message: 'Quiz successfully updated',
            data: exercise
        });

    } catch (error) {
        errorHandling(error, req, res)
    }
};

// ----------------------------------------------------------------------
// ANSWER (Student Submission)
// ----------------------------------------------------------------------

/**
 * Processes student answers using AI Service.
 * Calculates similarity score between Student Answer (Audio/Image) and Key.
 * * @async
 * @function answer
 * @memberof module:ExerciseController
 * @param {string} req.body.exerciseId - Exercise ID.
 * @param {string} req.body.quizId - Quiz ID.
 * @param {Array} req.body.answers - Array of answer objects (base64 file, duration, etc).
 * @returns {Promise<void>} Updated exercise with scored answers.
 */
exports.answer = async (req, res) => {
    try {
        const { exerciseId, quizId, answers } = req.body;

        const exercise = await exerciseModel.findById(exerciseId);
        if (!exercise) return res.status(400).json({ success: false, message: 'Exercise not found' });

        const quiz = exercise.quiz.find(d => d._id == quizId);
        if (!quiz) return res.status(400).json({ success: false, message: 'Quiz not found' });

        let totalPoints = 0;
        quiz.answers = [];

        for (const ans of answers) {
            const originalQuestion = quiz.questions.find(q => q._id.toString() === ans.questionId);
            if (!originalQuestion) continue;

            const base64Content = ans.answer.split(',')[1] || ans.answer;
            let responseFromAI = { text: '', similarity: 0 };

            // 1. Process AI Transcription
            console.log(ans.fileType)
            if (ans.fileType.startsWith('image/')) {
                responseFromAI = await aiService.processImageToText(ans.answer, originalQuestion.key);
            } else if (ans.fileType.startsWith('audio/')) {
                responseFromAI = await aiService.processAudioToText(base64Content, originalQuestion.key);
            }

            // 2. Scoring Logic
            let score = responseFromAI.similarity || 0;

            totalPoints += score;

            // 3. Save Answer Data
            quiz.answers.push({
                questionId: ans.questionId,
                answer: { file: ans.answer, text: responseFromAI.text },
                similarityPoint: score,
                timeOpened: ans.timeOpened,
                timeAnswered: ans.timeAnswered,
                duration: ans.duration
            });
        }

        if (quiz.questions.length > 0) totalPoints = totalPoints / quiz.questions.length;
        quiz.quizPoint = parseInt(totalPoints);

        await exercise.save();

        return res.json({ success: true, message: 'Answers processed successfully', data: exercise });
    } catch (error) {
        errorHandling(error, req, res);
    }
};

// ----------------------------------------------------------------------
// TEACHER ACTIONS
// ----------------------------------------------------------------------

/**
 * Updates Attitude Score for a student's quiz.
 * Access: Teacher only.
 * * @async
 * @function attitude
 * @memberof module:ExerciseController
 * @param {string} req.body.note - Teacher's feedback note.
 * @param {number} req.body.point - Attitude score (0-100).
 */
exports.attitude = async (req, res) => {
    try {
        if (req.user.role !== 1) return res.status(403).json({ success: false, message: 'Forbidden access' });

        const { exerciseId, quizId, note, point } = req.body;
        const exercise = await exerciseModel.findById(exerciseId);

        if (!exercise) return res.status(400).json({ success: false, message: 'Exercise not found' });

        const quiz = exercise.quiz.id(quizId);
        if (!quiz) return res.status(400).json({ success: false, message: 'Quiz not found' });

        if (!note || !point) return res.status(422).json({ success: false, message: 'Validation error', errors: { note: "Catatan & Nilai wajib" } });

        quiz.attitudePoint = { note, point };
        await exercise.save();

        res.status(200).json({ success: true, message: 'Successfully save attitude point' });
    } catch (error) {
        errorHandling(error, req, res);
    }
};

/**
 * Toggles visibility of a Quiz (Show/Hide from student).
 * Access: Teacher only.
 * * @async
 * @function visibilty
 * @memberof module:ExerciseController
 */
exports.visibilty = async (req, res) => {
    try {
        if (req.user.role !== 1) return res.status(403).json({ success: false, message: 'Forbidden access' });

        const exercise = await exerciseModel.findById(req.params.id);
        if (!exercise) return res.status(400).json({ success: false, message: 'Exercise not found' });

        const quiz = exercise.quiz.find(d => d._id == req.params.quizId);
        if (!quiz) return res.status(400).json({ success: false, message: 'Quiz not found' });

        quiz.isHidden = !quiz.isHidden;
        await exercise.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, message: 'Successfully updating status', data: { isHidden: quiz.isHidden } });
    } catch (error) {
        errorHandling(error, req, res);
    }
};


// Generate exercise
exports.generate = async (req, res) => {
    try {
        const { quantity, method, exerciseId } = req.body;

        const quizHistory = await questionBankModel.find();

        const childrenId = await exerciseModel.findById(exerciseId)
        // console.log(childrenId.childrenId);

        const exercises = await exerciseModel.find({ childrenId: childrenId.childrenId });
        let assessment = [] // dari jawaban anak
        exercises.forEach(element => {
            element.quiz.forEach((item) => {
                item.questions.forEach(q => {
                    const answer = item.answers.find(a => a.questionId.toString() === q._id.toString());

                    if (answer) {
                        assessment.push({
                            method: q.method,
                            question: q.question,
                            key: q.key,
                            answer: {
                                text: answer.answer.text,
                                duration: answer.duration,
                                similarityPoint: answer.similarityPoint
                            }
                        })
                    }
                })
            })
        });
        assessment = assessment.slice(-10)

        const listImages = [
            'anjing',
            'buku',
            'gunting',
            'kucing',
            'kursi',
            'meja',
            'mobil',
            'motor',
            'pensil',
            'pesawat',
            'singa',
            'ular',
        ]

        const prompt = exercisePrompt({
            quantity,
            method,
            quizHistory,
            assessment,
            listImages
        });

        const model = "gpt-oss:20b-cloud" // sweet spot for now
        const result = await aiService.generateLLM({
            prompt,
            model: model,
            retries: 3
        });

        // --- FILTERING & VALIDATION LOGIC ---

        // 1. Pastikan result adalah object/array (jika string, parse dulu)
        let parsedQuestions = typeof result === 'string' ? JSON.parse(result.replace(/```json|```/g, "")) : result;

        // 2. Lakukan Filter Berdasarkan Kriteria
        const filteredQuestions = parsedQuestions.filter((item) => {
            // A. Filter Method (Hanya 1 - 6)
            const isValidMethod = item.method >= 1 && item.method <= 6;

            // B. Jika user minta method spesifik (method != 0), pastikan hanya method itu yang lolos
            const matchesRequestedMethod = method == 0 ? true : item.method == method;

            // C. Validasi Khusus Aritmatika (Method 6): Tidak boleh ada path/gambar
            if (item.method === 6 && item.question.type === 'path') return false;

            // D. Validasi Gambar (Method 5): Harus ada di listImages (cek nama file murni tanpa path)
            if (item.question.type === 'path') {
                const imageName = item.question.value.replace('storage/exercise/', ''); // bersihkan path jika AI terlanjur nambahin
                if (!listImages.includes(imageName)) return false;
            }

            return isValidMethod && matchesRequestedMethod;
        });

        // 3. Map untuk menambahkan path 'storage/exercise/' dan extensi .png jika belum ada
        const finalQuestions = filteredQuestions.map(item => {
            if (item.question.type === 'path') {
                // Pastikan nama file bersih dari path lama, lalu tambahkan path yang diinginkan
                const fileName = item.question.value.split('/').pop(); // ambil 'kucing' saja
                const formattedFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;

                return {
                    ...item,
                    question: {
                        ...item.question,
                        value: `image/exercise/${formattedFileName}`
                    }
                };
            }
            return item;
        }).slice(0, quantity); // Ambil sesuai quantity yang diminta

        return res.status(200).json({ success: true, message: 'Success generating questions', data: { questions: finalQuestions } })

    } catch (err) {
        errorHandling(err, req, res)
    }
}