const { errorHandling } = require("../helpers/errorHandling")
const exerciseModel = require("../models/exerciseModel")
const userModel = require("../models/userModel")

exports.index = async (req, res) => {
    try {
        let data = {}

        if (req.user.role === 1) {
            // Total Score
            data.score = {
                highest: 0,
                lowest: 0,
            }

            // Child By Level
            data.childTotal = {
                levelOne: 0,
                levelTwo: 0,
                levelThree: 0,
                noLevel: 0
            }

            // Child with Score
            data.scoreList = []
            // find child
            const childs = await userModel.find({ teacherId: req.user.userId, role: 3 })

            for (const d of childs) {
                // calculate child by level
                if (d.level == 1) {
                    data.childTotal.levelOne += 1
                } else if (d.level == 2) {
                    data.childTotal.levelTwo += 1
                } else if (d.level == 3) {
                    data.childTotal.levelThree += 1
                } else {
                    data.childTotal.noLevel += 1
                }

                // calculate point
                const exercises = await exerciseModel.find({ childrenId: d._id });
                let point = 0;
                exercises.forEach(e => {
                    e.quiz.forEach(q => {
                        if (q.quizPoint)
                            point += parseInt(q.quizPoint);
                    });
                    point = Math.round(point / e.quiz.length) || 0

                });
                // calculate scoreList
                data.scoreList.push({
                    childId: d._id,
                    name: d.fullName,
                    level: d.level,
                    point: point
                });

            }

            // calculate highest and lowest score by child
            data.scoreList.forEach(d => {
                if (data.score.highest < d.point) {
                    data.score.highest = d.point
                } else if (data.score.lowest > d.point) {
                    data.score.lowest = d.point
                }
            })
        } else if (req.user.role === 2) {
            data.childs = []

            const childs = await userModel.find({ parentsId: req.user.userId, role: 3 })

            for (c of childs) {

                const teacher = await userModel.findById(c.teacherId)

                const exerciseList = []

                const exercises = await exerciseModel.find({ childrenId: c._id })
                exercises.forEach(e => {
                    let point = 0

                    e.quiz.forEach(q => {
                        if (q.quizPoint)
                            point += parseInt(q.quizPoint)
                    })

                    point = Math.round(point / e.quiz.length) || 0

                    exerciseList.push({
                        exerciseId: e._id,
                        name: e.name,
                        point: 80//point
                    })
                })

                data.childs.push({
                    name: c.fullName,
                    level: c.level ?? null,
                    code: c.code,
                    teacherName: teacher?.fullName ?? '-',
                    exercises: exerciseList,
                    ex: exercises
                })
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Successfully received data',
            data: data
        })
    } catch (error) {
        errorHandling(error, req, res);
    }
}