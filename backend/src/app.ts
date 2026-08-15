import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true })); // allow frontend proxy
app.use(express.json());
app.use(cookieParser());

// Routes Placeholder
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

export default app;
