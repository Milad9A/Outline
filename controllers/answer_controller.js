const Answer = require('../models/answer_model')

const AnswerController = {
    createAnswer: async (req, res) => {
        const answer = new Answer({
            ...req.body,
            owner_user_id: req.user._id,
        })

        try {
            await answer.save()
            res.status(201).send(answer)
        } catch (error) {
            res.status(400).send(error)
        }
    },

    getMyAnswers: async (req, res) => {
        try {
            await req.user.populate('answers').execPopulate()

            res.send(req.user.answers)
        } catch (error) {
            res.status(400).send(error)
        }
    },

    getAnswer: async (req, res) => {
        const _id = req.params.id

        try {
            const answer = await Answer.findOne({
                _id,
                owner_user_id: req.user._id,
            })

            if (!answer) return res.status(404).send()

            res.send(answer)
        } catch (error) {
            res.status(500).send()
        }
    },

    updateAnswer: async (req, res) => {
        const updates = Object.keys(req.body)

        try {
            const answer = await Answer.findOne({
                _id: req.params.id,
                owner_user_id: req.user._id,
            })

            if (!answer) return res.status(404).send()

            updates.forEach((update) => (answer[update] = req.body[update]))

            await answer.save()

            res.send(answer)
        } catch (error) {
            res.status(400).send(error)
        }
    },

    deleteAnswer: async (req, res) => {
        try {
            const answer = await Answer.findOneAndDelete({
                _id: req.params.id,
                owner_user_id: req.user._id,
            })

            if (!answer) return res.status(404).send()

            res.send(answer)
        } catch (error) {
            res.status(500).send(error)
        }
    },
}

module.exports = AnswerController