const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
    {
        medicine_id: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        exp_date: {
            type: Date,
            required: true,
            default: Date.now
        },
        stock: {
            type: Number,
            required: true
        },
        price: {
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
        }
    },
    {
        timestamps: true
    }
);


const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;