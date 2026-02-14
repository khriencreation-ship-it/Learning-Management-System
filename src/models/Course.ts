import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourse extends Document {
    title: string;
    description: string;
    instructor: string; // Could be a reference to a User (Tutor) in the future
    code: string;
    image: string;
    topics: number;
    lessons: number;
    quizzes: number;
    assignments: number;
    publishedAt: Date;
    status: 'active' | 'draft' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        instructor: {
            type: String,
            required: [true, 'Instructor name is required'],
        },
        code: {
            type: String,
            unique: true,
            uppercase: true,
            required: false, // Auto-generated if missing
        },
        status: {
            type: String,
            enum: ['active', 'draft', 'archived'],
            default: 'draft',
        },
        image: {
            type: String,
            default: '',
        },
        topics: {
            type: Number,
            default: 0,
        },
        lessons: {
            type: Number,
            default: 0,
        },
        quizzes: {
            type: Number,
            default: 0,
        },
        assignments: {
            type: Number,
            default: 0,
        },
        publishedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent model recompilation in development
const Course: Model<ICourse> =
    mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
