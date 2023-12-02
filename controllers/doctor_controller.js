require('dotenv').config();
const Inventory = require('../models/inventory');
const Doctor = require('../models/doctor');
const Patient = require('../models/patient');
const Admin = require('../models/admin');
const sms = require('../config/twilio_sms');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailer = require('../mailers/mailer');

// Doctor Profile 
module.exports.profile = async function (req, res) {
    try {
        const user = await Doctor.findOne({ _id: req.user.id });
        if (user) {
            const data = await Inventory.find({});
            return res.render('doctor_profile', {
                title: 'Doctor Profile',
                user: user,
                data: data
            });
        } else {
            return res.redirect('/');
        }
    } catch (err) {
        console.error('Error in profile:', err);
        return res.status(500).send('Internal Server Error');
    }
}

// doctor signup page
module.exports.signUp = async function (req, res) {
    try {
        const user = await Admin.findOne({ _id: req.user.id });
        if (user) {
            const doctor = await Doctor.find({});
            return res.render('doctor_sign_up', {
                title: "Doctor SignUp",
                doctor: doctor
            });
        } else {
            return res.redirect('back');
        }
    } catch (err) {
        console.error('Error in signUp:', err);
        return res.status(500).send('Internal Server Error');
    }
}



module.exports.updateProfile = async function (req, res) {
    try {
        const id = req.body.id;

        // Find the doctor by email
        const doctor = await Doctor.findOne({ _id: id });

        if (!doctor) {
            req.flash('error', 'No Doctor Exists!!');
            return res.redirect('back');
        }
        await Doctor.findByIdAndUpdate(doctor._id, { $unset: { patients: 1 } });
        let time = parseInt(req.body.timings); // Assuming you store timings as a string, adjust accordingly
        let am_pm = 'AM';
        let newTime = time;
        if (time > 12) {
            am_pm = 'PM';
            newTime = time % 12;
        }
        if (time == 12) {
            am_pm = 'PM';
        }
        const patientTimings = [];
        let patientData = {
            check: false,
            confirm: false,
            name: "", // Add patient name if available
            email: "", // Add patient email if available
            mobile: "", // Add patient mobile if available
            address: "", // Add patient address if available
            am_pm: am_pm,
            timing: newTime,
        };
        patientTimings.push(patientData);
        // Create 11 patients with timings
        for (let i = 1; i < 12; i++) {
            if (i % 2 == 0) {
                newTime = time;
                let am_pm = 'AM';
                if (time > 12) {
                    newTime = time % 12;
                    am_pm = 'PM';
                }
                if (time == 12) {
                    am_pm = 'PM';
                }
                patientData = {
                    check: false,
                    confirm: false,
                    name: "", // Add patient name if available
                    email: "", // Add patient email if available
                    mobile: "", // Add patient mobile if available
                    address: "", // Add patient address if available
                    am_pm: am_pm,
                    timing: newTime,
                };
            }
            else {
                newTime = time;
                let am_pm = 'AM';
                if (time > 12) {
                    am_pm = 'PM';
                    newTime = time % 12;
                }
                if (time == 12) {
                    am_pm = 'PM';
                }
                newTime = newTime + '.30';
                patientData = {
                    check: false,
                    confirm: false,
                    name: "", // Add patient name if available
                    email: "", // Add patient email if available
                    mobile: "", // Add patient mobile if available
                    address: "", // Add patient address if available
                    am_pm: am_pm,
                    timing: newTime,
                };
                time++;
            }
            patientTimings.push(patientData);
        }
        await Doctor.findByIdAndUpdate(doctor._id, {
            $set: {
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mobile,
                education: req.body.education,
                specialization: req.body.specialization,
                experience: req.body.experience,
                fee: req.body.fee,
                timings: req.body.timings,
                patients: patientTimings,
            }
        });


        // Redirect or send a success response
        req.flash('success', 'Doctor Profile Updated Successfully!!');
        res.redirect('back');

    } catch (error) {
        console.error('Error in updateProfile:', error);
        req.flash('error', 'Some Problem there!!');
        return res.redirect('back');
    }

}

module.exports.destroyDoctor = async function (req, res) {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (doctor) {
            await doctor.deleteOne();
            req.flash('success', 'Deleted Successfully!!');
            res.redirect('back');
        }
        else {
            req.flash('error', 'No such Doctor exists!!')
            return res.redirect('back');
        }
    } catch (err) {
        console.error('Error in Removing Doctor:', err);
        req.flash('error', err)
        return res.redirect('back');
    }
}


// doctor Signin page
// Doctor Sign In
module.exports.signIn = function (req, res) {
    try {
        if (req.isAuthenticated()) {
            return res.redirect('/doctor/patient-diagnosis');
        }
        return res.render('doctor_sign_in', {
            title: "Doctor SignIn"
        });
    } catch (err) {
        console.error('Error in signIn:', err);
        return res.status(500).send('Internal Server Error');
    }
}



// Doctor Forgot Password Render
module.exports.forgotPasswordGet = function (req, res) {
    try {
        if (req.isAuthenticated()) {
            return res.redirect('/doctor/patient-diagnosis');
        }
        return res.render('doctor_forgot_password', {
            title: "Forgot Password"
        });
    } catch (err) {
        console.error('Error in forgotPasswordGet:', err);
        return res.status(500).send('Internal Server Error');
    }
}


module.exports.forgotPasswordPost = async function (req, res) {
    try {
        const email = req.body.email;
        const User = await Doctor.findOne({ email: email });
        if (User) {
            const secret = process.env.JWT_SECRET + User.password;
            const payload = {
                email: User.email,
                id: User._id
            }
            const token = jwt.sign(payload, secret, { expiresIn: '15m' });
            const link = `http://localhost:8000/doctor/reset-password/${User._id}/${token}`;
            const data = {
                name: User.name,
                email: User.email,
                link: link
            };
            mailer.sendForgotPassword(data);
            req.flash('success', 'Reset Email has been sent to you!');
            return res.redirect('back');

        }
        else {
            req.flash('error', 'No User found with this email ID');
            return res.redirect('/doctor/sign-in');
        }

    } catch (err) {
        console.log("Error in reset password:", err);
        req.flash('error', 'Unable to reset password');
        return res.redirect("back");
    }
}


// Reset Password Page render
module.exports.resetPasswordGet = async function (req, res) {
    try {
        if (req.isAuthenticated()) {
            return res.redirect('/doctor/patient-diagnosis');
        }
        const { id, token } = req.params;
        const User = await Doctor.findOne({ _id: id });
        if (User) {
            try {
                const secret = process.env.JWT_SECRET + User.password;
                const payload = jwt.verify(token, secret);
                return res.render('doctor_reset_password', {
                    title: "Reset Password",
                    email: User.email
                })
            } catch (err) {
                req.flash('error', 'Password Reset Link is no More active');
                return res.redirect("/doctor/sign-in");
            }
        }
        else {
            req.flash('error', 'No User found with this ID');
            return res.redirect('/doctor/sign-in');
        }
    } catch (error) {
        console.error('Error in resetPasswordGet:', err);
        return res.status(500).send('Internal Server Error');
    }
}



// Doctor Reset Password Post
module.exports.resetPasswordPost = async function (req, res) {
    try {
        const { id, token } = req.params;
        const { password, confirm_password } = req.body;
        const User = await Doctor.findOne({ _id: id });
        if (User) {
            const secret = process.env.JWT_SECRET + User.password;
            const payload = jwt.verify(token, secret);
            if (password === confirm_password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                User.password = hashedPassword;
                await User.save();
                req.flash('success', 'Password Successfully Reset!');
                return res.redirect('/doctor/sign-in');
            }
            else {
                req.flash('success', 'Password And Confirm Password do not match!');
                return res.redirect('/doctor/sign-in');
            }
        }
        else {
            req.flash('error', 'No User found with this ID');
            return res.redirect('/doctor/sign-in');
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            req.flash('error', 'Password Reset Link has expired');
        } else if (error.name === 'JsonWebTokenError') {
            req.flash('error', 'Invalid Token');
        } else {
            req.flash('error', 'Unable to reset password');
        }
        console.log("Error in reset password:", error);
        return res.redirect("/doctor/sign-in");
    }
}




// Doctor View Patient Page render
module.exports.patients = async function (req, res) {
    try {
        if (!req.isAuthenticated()) {
            return res.redirect('/');
        }
        const doctor = await Doctor.findOne({ _id: req.user.id });
        if (!doctor) {
            throw new Error('Doctor not found');
        }
        const timingsPatient = doctor.patients.filter(patient => !patient.check);
        return res.render('doctor_view_patient', {
            title: "Patient Details",
            user: doctor,
            timingsPatient: timingsPatient
        });
    } catch (error) {
        console.error("Error in patients function:", error);
        req.flash('error', 'Error fetching patient details');
        return res.redirect('/');
    }

}



// creating a Doctor
module.exports.create = async function (req, res) {
    try {
        if (req.body.password != req.body.confirm_password) {
            req.flash('error', 'Password does not match!!');
            return res.redirect('back');
        }
        const user = await Doctor.findOne({ email: req.body.email });
        if (!user) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            req.body.password = hashedPassword;
            const newDoctor = await Doctor.create(req.body);


            let time = parseInt(newDoctor.timings); // Assuming you store timings as a string, adjust accordingly
            let am_pm = 'AM';
            let newTime = time;
            if (time > 12) {
                am_pm = 'PM';
                newTime = time % 12;
            }
            if (time == 12) {
                am_pm = 'PM';
            }
            const patientTimings = [];
            let patientData = {
                check: false,
                confirm: false,
                name: "", // Add patient name if available
                email: "", // Add patient email if available
                mobile: "", // Add patient mobile if available
                address: "", // Add patient address if available
                am_pm: am_pm,
                timing: newTime,
            };
            patientTimings.push(patientData);
            // Create 11 patients with timings
            for (let i = 1; i < 12; i++) {
                if (i % 2 == 0) {
                    newTime = time;
                    let am_pm = 'AM';
                    if (time > 12) {
                        newTime = time % 12;
                        am_pm = 'PM';
                    }
                    if (time == 12) {
                        am_pm = 'PM';
                    }
                    patientData = {
                        check: false,
                        confirm: false,
                        name: "", // Add patient name if available
                        email: "", // Add patient email if available
                        mobile: "", // Add patient mobile if available
                        address: "", // Add patient address if available
                        am_pm: am_pm,
                        timing: newTime,
                    };
                }
                else {
                    newTime = time;
                    let am_pm = 'AM';
                    if (time > 12) {
                        am_pm = 'PM';
                        newTime = time % 12;
                    }
                    if (time == 12) {
                        am_pm = 'PM';
                    }
                    newTime = newTime + '.30';
                    patientData = {
                        check: false,
                        confirm: false,
                        name: "", // Add patient name if available
                        email: "", // Add patient email if available
                        mobile: "", // Add patient mobile if available
                        address: "", // Add patient address if available
                        am_pm: am_pm,
                        timing: newTime,
                    };
                    time++;
                }
                patientTimings.push(patientData);
            }
            await Doctor.findByIdAndUpdate(newDoctor._id, { $set: { patients: patientTimings } });

            req.flash('success', 'Doctor ID Created Successfully!!');
            return res.redirect("/admin/add-inventory");
        } else {
            req.flash('error', 'Doctor Already Exists!!');
            throw new Error("User already exists");
        }
    } catch (err) {
        console.log("Error in signing up:", err);
        req.flash('error', 'Error creating doctor ID');
        return res.redirect("back");
    }
}


// creating patient i.e creating report 
module.exports.addPatient = async function (req, res) {
    try {
        let token;
        let isTokenUnique = false;

        // Function to generate a random token of varying length
        const generateRandomToken = () => {
            const length = Math.floor(Math.random() * 9) + 1; // Random length between 1 and 9
            let result = '';
            const characters = '0123456789'; // Characters to include in the token

            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            return result;
        };

        // Keep generating a random token until a unique one is found
        while (!isTokenUnique) {
            token = generateRandomToken();

            // Check if the token already exists in the database
            const existingPatient = await Patient.findOne({ token: token });

            if (!existingPatient) {
                isTokenUnique = true; // Unique token found
            }
        }

        const { name, number, email } = req.body;
        let canvasImage = req.body.canvasImage || '';

        // sending sms to user
        sms.tokenSms(name, number, token);
        // Create the patient with the unique token
        const doctorName = req.user.name;
        await Patient.create({ token, name, doctorName, email, number, canvasImage });

        req.flash('success', 'Patient Report created Successfully!!');
        return res.redirect("/doctor/patient-diagnosis");
    } catch (err) {
        console.error("Error:", err);
        req.flash('error', 'Failed to add patient report.');
        return res.redirect('back');
    }
}




// creating session for doctor on signin
module.exports.createSession = async function (req, res) {
    try {
        req.flash('success', 'You Have Signed In Successfully!!');
        return res.redirect('/doctor/patient-diagnosis');
    } catch (error) {
        console.error("Error in createSession function:", error);
        req.flash('error', 'Error during login');
        return res.redirect("/doctor/sign-in");
    }
}


// doctor logout
module.exports.destroySession = async function (req, res) {
    try {
        req.logout(function (err) {
            if (err) {
                // Handle any error that occurred during logout
                console.error(err);
                throw new Error('Logout error');
            }
            req.flash('success', 'Logged Out Successfully!!');
            return res.redirect("/");
        });
    } catch (error) {
        console.error("Error in destroySession function:", error);
        req.flash('error', 'Error logging out');
        return res.redirect("/");
    }
}