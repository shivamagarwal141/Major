const express = require('express');
const router = express.Router();
const passport = require('passport');

const staffController = require('../controllers/staff_controller');

router.get('/update', passport.checkAuthentication, staffController.update);
router.get('/sign-in', staffController.signIn);




// forgot password
router.get('/forgot-password', staffController.forgotPasswordGet);
router.post('/forgot-password', staffController.forgotPasswordPost);
router.get('/reset-password/:id/:token', staffController.resetPasswordGet);
router.post('/reset-password/:id/:token', staffController.resetPasswordPost);




router.get('/search/:name', passport.checkAuthentication, staffController.search);
router.get('/search', passport.checkAuthentication, passport.checkAuthentication, staffController.Showsearch);
router.get('/patient', passport.checkAuthentication, staffController.patient);
router.post('/create-session', passport.authenticate(
    'local',
    { failureRedirect: '/admin/sign-in' },
), staffController.createSession);
router.get('/sign-out', staffController.destroySession);
module.exports = router;