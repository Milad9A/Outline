const express = require('express')
const auth = require('../middleware/auth')
const multer = require('multer')
const Course = require('../models/course_model')
const credentials = require('../config/credentials.json')
const { google } = require('googleapis')
const streamifier = require('streamifier')
const CourseContent = require('../models/course_content_model')
const User = require('../models/user_model')
const Role = require('../models/role_model')

const CourseController = require('../controllers/course_controller')

const router = express.Router()

const upload = multer({
    limits: {
        fileSize: 10000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(mp4|mkv)$/)) {
            return cb(
                new Error('Please upload a valid video format (mp4 or mkv)')
            )
        }
        cb(undefined, true)
    },
}).array('content')

router.post('/courses', auth, CourseController.createCourse)

router.post('/courses/:id/purchase', auth, CourseController.purchaseCourse)

router.get('/courses', CourseController.getAllCourses)

router.get('/courses/me', auth, CourseController.getMyCourses)

router.get('/courses/:id', auth, CourseController.getCourse)

router.patch('/courses/:id', auth, CourseController.updateCourse)

router.delete('/courses/:id', auth, CourseController.deleteCourse)

router.get(
    '/courses/:id/categories',
    auth,
    CourseController.getCourseCategories
)

router.patch('/courses/:id/contents', auth, async (req, res) => {
    upload(req, res, async function (error) {
        if (error) {
            return res.status(400).send(error)
        }

        const course = await Course.findById(req.params.id)

        if (!course) return res.status(404).send()

        const user = await User.findById(req.user._id)
        const userRole = user.role

        if (userRole === Role.BASIC_USER)
            return res.status(400).send({
                error: 'You must be an Instructor in order to create courses',
            })

        const scopes = ['https://www.googleapis.com/auth/drive']
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            scopes
        )
        const drive = google.drive({ version: 'v3', auth })

        try {
            for (let index = 0; index < req.files.length; index++) {
                const buffer = await req.files[index].buffer
                const name = req.files[index].originalname
                const mimetype = req.files[index].mimetype
                const driveResponse = await drive.files.create({
                    requestBody: {
                        name: name,
                        mimeType: mimetype,
                        parents: ['1rX5J_XGIM45Ey65qJJGui1w6EeKgDPP2'],
                    },
                    media: {
                        mimeType: mimetype,
                        body: streamifier.createReadStream(buffer),
                    },
                })
                const newContent = new CourseContent({
                    content_name: driveResponse.data.name,
                    content_link:
                        'https://drive.google.com/file/d/' +
                        driveResponse.data.id +
                        '/view',
                    course_id: req.params.id,
                })
                await newContent.save()
                course['contents'].push(newContent.id)
                await course.save()
            }

            await course.populate('contents').execPopulate()

            res.status(200).send(course)
        } catch (error) {
            console.log(error)
            console.error(error)
            res.status(400).send(error)
        }
    })
})

module.exports = router
