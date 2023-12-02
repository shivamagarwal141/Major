const Doctor = require('../models/doctor');
const cron = require('node-cron');
const mailer = require('../mailers/mailer');
const sms = require('../config/twilio_sms');


// Schedule a job to run at midnight every day
cron.schedule('0 0 * * *', async () => {
    try {
        const doctors = await Doctor.find({});

        // Update the check property for each patient of each doctor
        for (const doctor of doctors) {
            for (const patient of doctor.patients) {
                // Check if the patient's date is not today
                patient.check = false;
                patient.confirm = false;
                patient.name = '';
                patient.mobile = '';
                patient.email = '';
                patient.address = '';
            }
            await doctor.save();
        }

        // Save the changes
        await Promise.all(doctors.map(doctor => doctor.save()));

        console.log('Daily update completed.');
    } catch (error) {
        console.error('Error during daily update:', error);
    }
});


// Rendering book appointment page
module.exports.appointment = async function (req, res) {
    try {
        const doctors = await Doctor.find({});

        if (!doctors) {
            throw new Error('Error fetching doctor information');
        }

        return res.render('book_appointment', {
            title: 'Book Appointment',
            doctor: doctors
        });
    } catch (error) {
        req.flash('error', 'An error occurred while fetching doctor information');
        return res.redirect('/');
    }
}


// Rendering doctor details page
module.exports.details = async function (req, res) {
    try {
        const doctors = await Doctor.find({});

        if (!doctors) {
            throw new Error('Error fetching doctor information');
        }

        return res.render('doctor_details', {
            title: 'Doctor Details',
            doctor: doctors
        });
    } catch (error) {
        req.flash('error', 'An error occurred while fetching doctor information');
        return res.redirect('/');
    }
}


// booking appointment
module.exports.create = async function (req, res) {
    try {
        const { email, name, mobile, address, doctor, timings } = req.body;
        const selectedDoctor = await Doctor.findOne({ name: doctor });
        if (!selectedDoctor) {
            req.flash('error', 'Doctor not found');
            return res.redirect("back");
        }
        const selectedTiming = selectedDoctor.patients.find(patient => patient.timing === timings);
        if (selectedTiming) {
            selectedTiming.check = true;
            selectedTiming.confirm = false;
            selectedTiming.name = name;
            selectedTiming.email = email;
            selectedTiming.mobile = mobile;
            selectedTiming.address = address;

            // Save the changes
            await selectedDoctor.save();

            req.flash('success', 'Appointment booked successfully');
            return res.redirect("back");
        } else {
            req.flash('error', 'Selected timing not found');
            return res.redirect("back");
        }
    }
    catch (error) {
        req.flash('error', 'Unable to book, some internal error');
        return res.redirect("back");
    }
}


// Geting doctor timings for selected doctor
module.exports.getDoctorTimings = async function (req, res) {
    try {
        // Get doctor timings based on the selected doctor name
        const doctorName = req.params.doctorName;
        const doctor = await Doctor.findOne({ name: doctorName });

        if (doctor) {
            // Send the timings as JSON response
            return res.json(doctor.patients); // Assuming timings are stored as a comma-separated string
        } else {
            return res.status(404).json({ error: 'Doctor not found' });
        }
    } catch (error) {
        console.log("Error fetching doctor timings:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


// confirm patient appointment
module.exports.confirmAppointment = async function (req, res) {
    try {
        const id = req.params.id;
        const doctor = await Doctor.findOne({ _id: req.user.id });
        const patientIndex = doctor.patients.findIndex(patient => patient.id === id);

        if (patientIndex !== -1) {
            const patient = doctor.patients[patientIndex];

            // Confirm the appointment
            patient.confirm = true;
            await doctor.save();

            // Get details for notification
            const name = patient.name;
            const email = patient.email;
            const number = patient.mobile;
            const time = patient.timing + " " + patient.am_pm;

            // Notify the patient
            const data = { name, email, time };
            mailer.confirmAppointment(data);
            sms.smsConfirmAppointment(name, number, time);

            req.flash('success', 'Appointment Confirmed Successfully!!');
            return res.redirect('back');
        } else {
            req.flash('error', 'Unable to confirm appointment!!');
            return res.redirect('back');
        }
    } catch (error) {
        req.flash('error', 'Unable to confirm appointment due to an internal error');
        return res.redirect('back');
    }
};



// rejecting appointment
module.exports.rejectAppointment = async function (req, res) {
    try {
        const { id, reason } = req.body;
        const doctor = await Doctor.findOne({ _id: req.user.id });
        const patientIndex = doctor.patients.findIndex(patient => patient.id === id);

        if (patientIndex !== -1) {
            const patient = doctor.patients[patientIndex];

            // Notify the patient
            const data = {
                name: patient.name,
                email: patient.email,
                reason: reason
            };
            mailer.rejectAppointment(data);
            sms.smsDeclineAppointment(patient.name, patient.mobile, reason);

            // Clear patient details
            patient.check = false;
            patient.confirm = false;
            patient.name = '';
            patient.email = '';
            patient.mobile = '';
            patient.address = '';

            // Save the changes
            await doctor.save();

            req.flash('success', 'Appointment Rejected Successfully!!');
            return res.redirect('back');
        } else {
            req.flash('error', 'Unable to reject appointment!!');
            return res.redirect('back');
        }
    } catch (error) {
        console.error('Error rejecting appointment:', error.message);
        req.flash('error', 'Unable to reject appointment due to an internal error');
        return res.redirect('back');
    }
};

// Change appointment timings
module.exports.modifyAppointment = async function (req, res) {
    try {
        const { id, time, reason } = req.body;
        const doctor = await Doctor.findOne({ _id: req.user.id });
        const patientIndex = doctor.patients.findIndex(patient => patient.id === id);

        if (patientIndex !== -1) {
            const currentPatient = doctor.patients[patientIndex];

            const name = currentPatient.name;
            const email = currentPatient.email;
            const number = currentPatient.mobile;

            // Find target patient based on the specified time
            const targetPatient = doctor.patients.find(patient => {
                return patient.timing === time && patient.id !== id && !patient.confirm;
            });

            if (targetPatient) {
                const newTime = time + " " + targetPatient.am_pm;
                const data = {
                    name: name,
                    email: email,
                    reason: reason,
                    time: newTime
                };

                // Update details for target patient
                targetPatient.check = true;
                targetPatient.confirm = true;
                targetPatient.name = name;
                targetPatient.email = email;
                targetPatient.mobile = currentPatient.mobile;
                targetPatient.address = currentPatient.address;

                // Clear details for the current patient
                currentPatient.check = false;
                currentPatient.confirm = false;
                currentPatient.name = '';
                currentPatient.email = '';
                currentPatient.mobile = '';
                currentPatient.address = '';

                // Save the changes
                await doctor.save();

                // Notify the patient
                mailer.modifyAppointment(data);
                sms.smsModifyAppointment(name, number, reason, newTime);

                req.flash('success', 'Appointment Re-Scheduled Successfully!!');
                return res.redirect('back');
            } else {
                req.flash('error', 'Unable to find available slot for the specified time');
                return res.redirect('back');
            }
        } else {
            req.flash('error', 'Unable to reschedule appointment!!');
            return res.redirect('back');
        }
    } catch (error) {
        console.error('Error modifying appointment:', error.message);
        req.flash('error', 'Unable to reschedule appointment due to an internal error');
        return res.redirect('back');
    }
};





// Destroy Patient 
module.exports.destroyPatient = async function (req, res) {
    try {
        const id = req.params.id;
        const doctor = await Doctor.findOne({ _id: req.user.id });
        const patientIndex = doctor.patients.findIndex(patient => patient.id === id);
        if (patientIndex !== -1) {
            doctor.patients[patientIndex].check = false;
            doctor.patients[patientIndex].confirm = false;
            doctor.patients[patientIndex].name = '';
            doctor.patients[patientIndex].email = '';
            doctor.patients[patientIndex].mobile = '';
            doctor.patients[patientIndex].address = '';

            await doctor.save();
            req.flash('success', 'Patient Deleted Successfully!!');
            res.redirect('back');
        }
        else {
            req.flash('error', 'Unable to delete!!')
            return res.redirect('back');
        }
    } catch (err) {
        req.flash('error', 'Unable to delete patient due to an internal error')
        return res.redirect('back');
    }
}