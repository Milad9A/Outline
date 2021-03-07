const Question = require('../models/question_model')
const Tag = require('../models/tag_model')

const QuestionController = {
    createQuestion: async (req, res) => {
        const question = new Question({
            ...req.body,
            owner_user_id: req.user._id,
        })

        let tags = []
        question.tags.forEach((tag) => {
            tags.push(tag)
        })

        tags.forEach(async (id) => {
            tag = await Tag.findOne({
                _id: id,
            })
            if (!tag)
                return res.status(404).send({
                    message:
                        'One or more of the tags that you provided are not available',
                })
            tag.questions.push(question)
            await tag.save()
        })

        try {
            await question.save()
            res.status(201).send(question)
        } catch (error) {
            res.status(400).send(error)
        }
    },

    getAllQuestions: async (req, res) => {
        try {
            await req.user.populate('questions').execPopulate()

            res.send(req.user.questions)
        } catch (error) {
            res.status(400).send(error)
        }
    },

    getQuestion: async (req, res) => {
        const _id = req.params.id

        try {
            const question = await Question.findOne({
                _id,
                owner_user_id: req.user._id,
            })

            if (!question) return res.status(404).send()
            res.send(question)
        } catch (error) {
            res.status(500).send()
        }
    },

    updateQuestion: async (req, res) => {
        const updates = Object.keys(req.body)

        try {
            const question = await Question.findOne({
                _id: req.params.id,
                owner_user_id: req.user._id,
            })

            if (!question) return res.status(404).send()

            updates.forEach((update) => (question[update] = req.body[update]))

            let tags = []

            question.tags.forEach((tag) => {
                tags.push(tag)
            })

            tags.forEach(async (id) => {
                tag = await Tag.findOne({
                    _id: id,
                })

                if (!tag)
                    return res.status(404).send({
                        message:
                            'One or more of the tags that you provided does not exist',
                    })
                tag.questions.push(question)
                await tag.save()
            })

            await question.save()

            res.send(question)
        } catch (error) {
            res.status(400).send(error)
        }
    },

    deleteQuestion: async (req, res) => {
        try {
            const question = await Question.findOneAndDelete({
                _id: req.params.id,
                owner_user_id: req.user._id,
            })

            if (!question) return res.status(404).send()

            res.send(question)
        } catch (error) {
            res.status(500).send()
        }
    },

    getQuestionTags: async (req, res) => {
        try {
            const question = await Question.findOne({
                _id: req.params.id,
            })

            if (!question) return res.status(404).send()

            await question.populate('tags').execPopulate()

            res.send(question.tags)
        } catch (error) {
            res.status(500).send()
        }
    },
}

module.exports = QuestionController
