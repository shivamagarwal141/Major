const mongoose = require('mongoose');
const sellSchema = new mongoose.Schema(
    {
        medicine_id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true
        },
        unit: {
            type: Number,
            required: true
        },
        cost: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        amount: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            required: true
        },
        gst: {
            type: Number,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff'
        }

    },
    {
        timestamps: true
    });

const sellInfo = mongoose.model('sellInfo', sellSchema);
module.exports = sellInfo;