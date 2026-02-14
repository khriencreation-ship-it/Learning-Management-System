import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get('parentId');

        let query = supabaseAdmin
            .from('media_folders')
            .select('*')
            .order('name', { ascending: true });

        if (parentId === 'null' || parentId === 'root') {
            query = query.is('parent_id', null);
        } else if (parentId) {
            query = query.eq('parent_id', parentId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching folders:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, parentId } = body;

        if (!name) {
            return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
        }

        // Logic to build the path
        let path = ',';
        if (parentId) {
            const { data: parent, error: parentError } = await supabaseAdmin
                .from('media_folders')
                .select('path, id')
                .eq('id', parentId)
                .single();

            if (parentError || !parent) {
                return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
            }
            path = `${parent.path}${parent.id},`;
        }

        const { data, error } = await supabaseAdmin
            .from('media_folders')
            .insert([{
                name,
                parent_id: parentId || null,
                path
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating folder:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids } = body; // Array of folder IDs

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // Recursive deletion strategy:
        // 1. Find ALL subfolders (descendants) of these folders.
        //    We can do this via the 'path' column. Any folder whose path contains these IDs is a child.
        //    Pattern: path LIKE '%,ID,%'

        let allFolderIdsToDelete = new Set(ids);

        // Fetch all folders to check hierarchy (inefficient if thousands, but okay for typical library)
        // Better: Use OR logic with path like
        const orConditions = ids.map(id => `path.ilike.%,${id},%`).join(',');

        const { data: descendantFolders, error: descendantsError } = await supabaseAdmin
            .from('media_folders')
            .select('id')
            .or(orConditions);

        if (descendantsError) {
            console.error('Error fetching descendants:', descendantsError);
            // Fallback: Proceed with just the IDs, but risk orphaned files if children aren't caught by cascade logic
        } else if (descendantFolders) {
            descendantFolders.forEach(f => allFolderIdsToDelete.add(f.id));
        }

        const folderIdsArray = Array.from(allFolderIdsToDelete);

        // 2. Find ALL files in these folders
        const { data: filesToDelete, error: filesError } = await supabaseAdmin
            .from('media_files')
            .select('id, key, bucket')
            .in('folder_id', folderIdsArray);

        if (filesError) {
            return NextResponse.json({ error: filesError.message }, { status: 500 });
        }

        // 3. Delete files from Storage
        if (filesToDelete && filesToDelete.length > 0) {
            const filesByBucket: Record<string, string[]> = {};
            filesToDelete.forEach(file => {
                const bucket = file.bucket || 'media-library';
                if (!filesByBucket[bucket]) filesByBucket[bucket] = [];
                filesByBucket[bucket].push(file.key);
            });

            const deletePromises = Object.entries(filesByBucket).map(async ([bucket, keys]) => {
                const { error: storageError } = await supabaseAdmin.storage
                    .from(bucket)
                    .remove(keys);
                if (storageError) console.error(`Failed to delete keys from ${bucket}:`, storageError);
            });
            await Promise.all(deletePromises);

            // Note: We don't need to manually delete from media_files DB table if we have ON DELETE CASCADE/SET NULL on the folder relation...
            // BUT our schema for media_files -> folder_id is "ON DELETE SET NULL". 
            // So we MUST manually delete the file records first, otherwise they will just become unorganized files.

            const { error: dbValuesError } = await supabaseAdmin
                .from('media_files')
                .delete()
                .in('id', filesToDelete.map(f => f.id));

            if (dbValuesError) console.error('Error deleting file records:', dbValuesError);
        }

        // 4. Delete Folders from DB
        // Deleting parents should cascade to children if defined in DB schema "ON DELETE CASCADE" for parent_id
        // Our schema: `constraint media_folders_parent_id_fkey foreign key (parent_id) references media_folders (id) on delete cascade`
        // So deleting the top level IDs is enough to remove the DB rows for subfolders.
        // However, we did step 3 manually to clean up storage.

        const { error: deleteFoldersError } = await supabaseAdmin
            .from('media_folders')
            .delete()
            .in('id', ids);

        if (deleteFoldersError) {
            return NextResponse.json({ error: deleteFoldersError.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Folders and contents deleted successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
