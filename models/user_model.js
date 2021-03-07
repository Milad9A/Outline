const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Role = require('./role_model')

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: Role,
            default: Role.BASIC_USER,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value))
                    throw new Error('Email is invalid')
            },
        },
        password: {
            type: String,
            required: true,
            minlength: 7,
            trim: true,
        },
        aboutMe: {
            type: String,
            trim: true,
            default: "I'm a human :)",
        },
        avatar: {
            type: Buffer,
        },
        reputation: {
            type: Number,
            default: 0,
            validate(value) {
                if (value < 0)
                    throw new Error('Reputation must be a positive number')
            },
        },
        accept_rate: {
            type: Number,
            default: 0,
            validate(value) {
                if (value < 0)
                    throw new Error('Accept rate must be a positive number')
            },
        },
        tokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
            },
        ],
        badge_counts: {
            bronze: {
                type: 'Number',
                default: 0,
            },
            silver: {
                type: 'Number',
                default: 0,
            },
            gold: {
                type: 'Number',
                default: 0,
            },
        },
    },
    {
        timestamps: true,
    }
)

userSchema.virtual('questions', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'owner_user_id',
})

userSchema.virtual('answers', {
    ref: 'Answer',
    localField: '_id',
    foreignField: 'owner_user_id',
})

userSchema.virtual('articles', {
    ref: 'Article',
    localField: '_id',
    foreignField: 'owner_user_id',
})

userSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'owner_user_id',
})

userSchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'owner_user_id',
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, 'thisisarandomstring')

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) throw new Error('Unable to login')

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw Error('Unable to login')

    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 8)

    next()
})

// TODO: Delete user stuff when user is deleted

const User = mongoose.model('User', userSchema)

module.exports = User