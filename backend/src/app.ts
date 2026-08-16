import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import productRoutes from './routes/products';
import inventoryRoutes from './routes/inventory';

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true })); // allow frontend proxy
app.use(express.json());
app.use(cookieParser());

// Expose Hard Disk images reliably over public local endpoints
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes Placeholder
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// Mounted Routers
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);

export default app;
