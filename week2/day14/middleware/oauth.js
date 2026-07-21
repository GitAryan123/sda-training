'use strict';

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
  callbackURL: '/api/v1/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@google.mock`;
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

    const existingUser = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email }
      ]
    });

    if (existingUser) {
      if (!existingUser.googleId) {
        existingUser.googleId = profile.id;
        await existingUser.save();
      }
      return done(null, existingUser);
    }

    const newUser = new User({
      googleId: profile.id,
      name: profile.displayName || profile.username || 'Google User',
      email,
      avatar,
      isActive: true,
      role: 'user'
    });

    await newUser.save();
    done(null, newUser);
  } catch (error) {
    done(error, null);
  }
}));

// Configure Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID || 'mock-facebook-app-id',
  clientSecret: process.env.FACEBOOK_APP_SECRET || 'mock-facebook-app-secret',
  callbackURL: '/api/v1/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name', 'picture']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@facebook.mock`;
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
    const name = profile.name ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() : 'Facebook User';

    const existingUser = await User.findOne({ 
      $or: [
        { facebookId: profile.id },
        { email }
      ]
    });

    if (existingUser) {
      if (!existingUser.facebookId) {
        existingUser.facebookId = profile.id;
        await existingUser.save();
      }
      return done(null, existingUser);
    }

    const newUser = new User({
      facebookId: profile.id,
      name: name || 'Facebook User',
      email,
      avatar,
      isActive: true,
      role: 'user'
    });

    await newUser.save();
    done(null, newUser);
  } catch (error) {
    done(error, null);
  }
}));

// Configure GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID || 'mock-github-client-id',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock-github-client-secret',
  callbackURL: '/api/v1/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@github.mock`;
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

    const existingUser = await User.findOne({ 
      $or: [
        { githubId: profile.id },
        { email }
      ]
    });

    if (existingUser) {
      if (!existingUser.githubId) {
        existingUser.githubId = profile.id;
        await existingUser.save();
      }
      return done(null, existingUser);
    }

    const newUser = new User({
      githubId: profile.id,
      name: profile.displayName || profile.username || 'GitHub User',
      email,
      avatar,
      isActive: true,
      role: 'user'
    });

    await newUser.save();
    done(null, newUser);
  } catch (error) {
    done(error, null);
  }
}));

// Serialize user for session support
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session support
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
