import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                tenantId: string;
                role: string;
            };
            tenantId?: string;
        }
    }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    let token = '';

    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const secret = process.env.JWT_SECRET;

    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL FATAL: JWT_SECRET must be defined in production environment');
    }

    try {
        const decoded = jwt.verify(token, secret || 'fallback-secret-development') as { userId: string, tenantId: string, role: string };

        // Inversion edge case: What if the token is valid but maliciously lacks tenantId? (e.g. bad token generation bypass)
        if (!decoded.tenantId) {
            return res.status(403).json({ error: 'Forbidden: Corrupt token payload missing tenant designation' });
        }

        req.user = decoded;
        req.tenantId = decoded.tenantId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};
