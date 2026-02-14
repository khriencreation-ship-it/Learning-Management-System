import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedia extends Document {
    filename: string;
    url: string;
    type: 'image' | 'video' | 'document' | 'archive' | 'other';
    size: number; // in bytes
    mimeType: string;
    bucket: string;
    key: string; // Supabase storage path
    folderId: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
    {
        filename: {
            type: String,
            required: [true, 'Filename is required'],
            trim: true,
        },
        url: {
            type: String,
            required: [true, 'URL is required'],
        },
        type: {
            type: String,
            enum: ['image', 'video', 'document', 'archive', 'other'],
            default: 'other',
        },
        size: {
            type: Number,
            default: 0,
        },
        mimeType: {
            type: String,
            default: 'application/octet-stream',
        },
        bucket: {
            type: String,
            default: 'media-library',
        },
        key: {
            type: String,
            required: [true, 'Storage key is required'],
        },
        folderId: {
            type: Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fetching media in a folder
MediaSchema.index({ folderId: 1 });

const Media: Model<IMedia> =
    mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
