import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFolder extends Document {
    name: string;
    parentId: mongoose.Types.ObjectId | null;
    path: string; // Materialized path for easier querying (e.g., ",rootId,parentId,")
    createdAt: Date;
    updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
    {
        name: {
            type: String,
            required: [true, 'Folder name is required'],
            trim: true,
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
        },
        path: {
            type: String,
            default: ',',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster lookups of children
FolderSchema.index({ parentId: 1 });

const Folder: Model<IFolder> =
    mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

export default Folder;
