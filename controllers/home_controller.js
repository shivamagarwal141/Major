const Admin = require('../models/admin');
const Staff = require('../models/staff');
const Doctor = require('../models/doctor');

module.exports.home = async function (req, res) {
    try {
        if (!req.isAuthenticated()) {
            return res.render('home', {
                title: "Home"
            });
        }

        const adminUser = await Admin.findOne({ _id: req.user.id });
        const staffUser = await Staff.findOne({ _id: req.user.id });
        const doctorUser = await Doctor.findOne({ _id: req.user.id });

        // Check for admin login
        if (adminUser) {
            return res.redirect('/admin/add-inventory');
        }

        // Check for staff login
        if (staffUser) {
            return res.redirect('/staff/update');
        }

        // check for doctor login
        if (doctorUser) {
            return res.redirect('/doctor/patient-diagnosis');
        }

        // If neither admin nor staff, render the home page
        return res.render('home', {
            title: "Home"
        });
    } catch (err) {
        console.log("Error in home controller:", err);
        if (err.name === 'SomeSpecificError') {
            req.flash('error', 'An error occurred. Please try again later.');
        } else {
            req.flash('error', 'Unexpected error. Please contact support.');
        }
        return res.redirect("/");
    }
}
