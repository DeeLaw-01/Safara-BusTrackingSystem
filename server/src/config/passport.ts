import { PassportStatic } from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';

import User from '../models/user.model';
import { UserRole } from '../../../shared/src/user.types';

export function configurePassport(passport: PassportStatic): void {
  // JWT Strategy
  const jwtOptions: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'secret',
  };

  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select('-password');
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );

  // Google OAuth Strategy (only if credentials are configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: Profile,
          done: (error: Error | null, user?: Express.User | false) => void
        ) => {
          try {
            // Check if user already exists
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
              return done(null, user);
            }

            // Check if user exists with same email
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = await User.findOne({ email });
              if (user) {
                // Link Google account to existing user
                user.googleId = profile.id;
                user.avatar = profile.photos?.[0]?.value;
                await user.save();
                return done(null, user);
              }
            }

            // Create new user
            user = await User.create({
              googleId: profile.id,
              email: email,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              role: UserRole.RIDER, // Default role for OAuth users
              isApproved: true, // Auto-approve OAuth users as riders
            });

            return done(null, user);
          } catch (error) {
            return done(error as Error, false);
          }
        }
      )
    );
  }
}
