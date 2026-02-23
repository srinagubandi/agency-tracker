/**
 * Passport.js Google OAuth 2.0 Strategy Configuration
 *
 * This file configures the passport-google-oauth20 strategy.
 * It is required once in index.js via require('./config/passport').
 *
 * Flow:
 *  1. User clicks "Sign in with Google" → GET /api/v1/auth/google
 *  2. Passport redirects to Google's consent screen
 *  3. Google redirects back to /api/v1/auth/google/callback
 *  4. This verify callback runs — finds or creates the user in our DB
 *  5. The auth route handler issues a JWT and redirects to the frontend
 *
 * Google OAuth is only available to internal users (super_admin, manager, worker).
 * Clients must use email/password login.
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { query } = require('../db/pool');

// Only configure the strategy if credentials are present
// (avoids crashing in environments where Google OAuth is not yet set up)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
                    'http://localhost:3001/api/v1/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email    = profile.emails?.[0]?.value;
        const name     = profile.displayName;

        if (!email) {
          return done(null, false, { message: 'No email returned from Google' });
        }

        // 1. Check if a user with this google_id already exists
        let result = await query(
          'SELECT * FROM users WHERE google_id = $1',
          [googleId]
        );

        if (result.rows.length > 0) {
          return done(null, result.rows[0]);
        }

        // 2. Check if an invited user with this email exists
        result = await query(
          "SELECT * FROM users WHERE email = $1 AND role != 'client'",
          [email]
        );

        if (result.rows.length === 0) {
          // No matching invited user — deny access
          return done(null, false, {
            message: 'No account found for this Google email. Please ask your admin to invite you first.',
          });
        }

        const user = result.rows[0];

        // 3. Link the Google account and activate the user
        const updated = await query(
          `UPDATE users
           SET google_id = $1, status = 'active', updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [googleId, user.id]
        );

        return done(null, updated.rows[0]);
      } catch (err) {
        return done(err);
      }
    }
  ));
}

// Passport requires serialize/deserialize even when using JWT (stateless)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err);
  }
});
