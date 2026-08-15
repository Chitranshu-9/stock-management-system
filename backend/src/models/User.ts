import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    tenantId: string;
    email: string;
    passwordHash: string;
    name: string;
    role: 'admin' | 'manager' | 'cashier';
    loginAttempts: number;
    lockUntil: number;
    comparePassword: (password: string) => Promise<boolean>;
}

const userSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'manager', 'cashier'], default: 'cashier' },
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Number }
}, { timestamps: true });

// Protect password entries by auto-hashing
userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model<IUser>('User', userSchema);
