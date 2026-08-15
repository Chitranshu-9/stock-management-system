import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import productRoutes from './routes/products';

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true })); // allow frontend proxy
app.use(express.json());
app.use(cookieParser());

// Routes Placeholder
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// Mounted Routers
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/products', productRoutes);

export default app;
