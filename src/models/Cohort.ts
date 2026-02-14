import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICohort extends Document {
    name: string;
    batch: string;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'completed' | 'upcoming';
    students: mongoose.Types.ObjectId[];
    tutors: mongoose.Types.ObjectId[];
    // courses: mongoose.Types.ObjectId[]; // Placeholder for future Course model
    createdAt: Date;
    updatedAt: Date;
}

const CohortSchema = new Schema<ICohort>(
    {
        name: {
            type: String,
            required: [true, 'Cohort name is required'],
            trim: true,
        },
        batch: {
            type: String,
            required: [true, 'Batch name/number is required'],
            trim: true,
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'upcoming'],
            default: 'upcoming',
        },
        students: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        tutors: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Prevent model recompilation in development
const Cohort: Model<ICohort> =
    mongoose.models.Cohort || mongoose.model<ICohort>('Cohort', CohortSchema);

export default Cohort;
