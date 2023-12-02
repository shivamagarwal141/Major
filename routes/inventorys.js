const express = require('express');
const router = express.Router();
const passport = require('passport');

const inventoryController = require('../controllers/inventory_controller');

router.post('/add', passport.checkAuthentication, inventoryController.addInventory);
router.post('/drop', passport.checkAuthentication, inventoryController.removeinventory);
router.get('/download-pdf/:userid', inventoryController.downloadPDF);

module.exports = router;