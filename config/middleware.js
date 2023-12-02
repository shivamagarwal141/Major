module.exports.setFlash = async function (req, res, next) {
    try {
        res.locals.flash = {
            'success': req.flash('success'),
            'error': req.flash('error')
        }
        next();
    }
    catch (error) {
        console.error('Error in setFlash middleware:', error);
        // Optionally, you may want to redirect to an error page or send an error response.
        res.status(500).send('Internal Server Error');
    }
}