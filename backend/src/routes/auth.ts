import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Tenant from '../models/Tenant';

const router = Router();

const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 2 * 60 * 1000; // 2 minutes

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            res.status(400).json({ error: 'Email and password are required valid strings' });
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user by email
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            // Do not reveal user existence
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check if account is currently locked out
        if (user.lockUntil && user.lockUntil > Date.now()) {
            res.status(429).json({ error: 'Maximum login attempts exceeded. Try again in 2 minutes.' });
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Increment failed attempts
            const updates: any = { $inc: { loginAttempts: 1 } };

            // If they just hit the max attempt, lock the account
            if (user.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
                updates.$set = { lockUntil: Date.now() + LOCK_TIME };
            }

            await User.updateOne({ _id: user._id }, updates);
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Account valid, ensure lock conditions are reset
        if (user.loginAttempts > 0 || user.lockUntil) {
            await User.updateOne({ _id: user._id }, { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
        }

        // Verify tenant is active
        const tenant = await Tenant.findOne({ tenantId: user.tenantId });
        if (!tenant || tenant.subscriptionStatus === 'suspended') {
            res.status(403).json({ error: 'Business account is suspended or invalid' });
            return;
        }

        const secret = process.env.JWT_SECRET;
        const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-dev';

        if (!secret && process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL FATAL: JWT_SECRET missing in production');
        }

        // Generate Access Token (15 mins)
        const accessToken = jwt.sign(
            { userId: user._id, tenantId: user.tenantId, role: user.role },
            secret || 'fallback-secret-development',
            { expiresIn: '15m' }
        );

        // Generate Refresh Token (7 days)
        const refreshToken = jwt.sign(
            { userId: user._id },
            refreshSecret,
            { expiresIn: '7d' }
        );

        // Assign HTTPOnly cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ error: 'No refresh token provided' });
            return;
        }

        const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-dev';
        const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string };

        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }

        const tenant = await Tenant.findOne({ tenantId: user.tenantId });
        if (!tenant || tenant.subscriptionStatus === 'suspended') {
            res.status(403).json({ error: 'Business account is suspended' });
            return;
        }

        const secret = process.env.JWT_SECRET || 'fallback-secret-development';
        const newAccessToken = jwt.sign(
            { userId: user._id, tenantId: user.tenantId, role: user.role },
            secret,
            { expiresIn: '15m' }
        );

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.json({ message: 'Token refreshed successfully' });

    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'strict' });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
    res.json({ message: 'Logged out successfully' });
});

export default router;
