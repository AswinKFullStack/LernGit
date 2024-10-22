// passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Adjust path as needed

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    scope: ['profile', 'email']
},
async function(accessToken, refreshToken, profile, done) {
        console.log('Profile:', profile); // Log the profile to inspect its structure
        if (!profile.emails || profile.emails.length === 0) {
            return done(null, false, { message: 'Email is missing from Google profile' });
        }

    const email = profile.emails[0].value;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            // Create a new user if not found
            user = new User({
                email,
                // Other user details if needed
            });
            await user.save();
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));


// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});
