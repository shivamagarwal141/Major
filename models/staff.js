const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;