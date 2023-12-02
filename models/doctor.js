const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        mobile: {
            type: String,
            required: true,
        },
        education: {
            type: String,
            required: true
        },
        specialization: {
            type: String,
            required: true
        },
        experience: {
            type: Number,
            required: true
        },
        fee: {
            type: Number,
            required: true
        },
        timings: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true,
        },
        patients: [
            {
                check: {
                    type: Boolean
                },
                confirm: {
                    type: Boolean
                },
                timing: {
                    type: String
                },
                am_pm: {
                    type: String,
                },
                name: {
                    type: String,
                },
                email: {
                    type: String,
                },
                mobile: {
                    type: String
                },
                address: {
                    type: String
                },
            },
        ]

    },
    {
        timestamps: true,
    }
);


const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;