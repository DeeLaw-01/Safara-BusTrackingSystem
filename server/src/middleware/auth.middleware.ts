import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

import { IUserDocument } from '../models/user.model';
import { UserRole } from '../../../shared/src/user.types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User extends IUserDocument {}
  }
}

export interface AuthenticatedRequest extends Request {
  user: IUserDocument;
}

// Authenticate using JWT
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: Error | null, user: IUserDocument | false) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Authentication error' });
    }
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Check if user is approved (for drivers)
export const requireApproved = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as IUserDocument;
  
  if (!user.isApproved) {
    res.status(403).json({ 
      success: false, 
      error: 'Account pending approval. Please wait for admin verification.' 
    });
    return;
  }
  
  next();
};

// Authorize specific roles
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as IUserDocument;

    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(user.role as UserRole)) {
      res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to perform this action' 
      });
      return;
    }

    next();
  };
};

// Shorthand middleware for common role checks
export const requireAdmin = authorize(UserRole.ADMIN);
export const requireDriver = authorize(UserRole.DRIVER);
export const requireRider = authorize(UserRole.RIDER);
export const requireDriverOrAdmin = authorize(UserRole.DRIVER, UserRole.ADMIN);
