import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { path, parentId } = body;
        // path expected format: "Folder/Subfolder" (relative to the parentId) or just "Folder"

        if (!path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        const cleanPath = path.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
        const segments = cleanPath.split('/');

        let currentParentId = parentId || null;

        // Iterate through each segment and find or create the folder
        for (const segment of segments) {
            if (!segment) continue;

            // 1. Check if folder exists in the current parent
            let query = supabaseAdmin
                .from('media_folders')
                .select('id')
                .eq('name', segment);

            if (currentParentId) {
                query = query.eq('parent_id', currentParentId);
            } else {
                query = query.is('parent_id', null);
            }

            const { data: existing, error: fetchError } = await query.single();

            if (existing) {
                currentParentId = existing.id;
            } else {
                // 2. Create if not exists
                // Need to fetch parent path to build the full materialized path
                let parentPathStr = ',';
                if (currentParentId) {
                    const { data: parentFolder } = await supabaseAdmin
                        .from('media_folders')
                        .select('path, id')
                        .eq('id', currentParentId)
                        .single();
                    if (parentFolder) {
                        parentPathStr = `${parentFolder.path}${parentFolder.id},`;
                    }
                }

                const { data: newFolder, error: createError } = await supabaseAdmin
                    .from('media_folders')
                    .insert([{
                        name: segment,
                        parent_id: currentParentId,
                        path: parentPathStr
                    }])
                    .select('id')
                    .single();

                if (createError) {
                    // Handle race condition: if it was created by another request in the meantime
                    if (createError.code === '23505') { // Unique violation (if constraint exists, though we don't strictly have one on name+parent yet, but assuming good practice)
                        // Retry fetch
                        const { data: retryExisting } = await query.single();
                        if (retryExisting) {
                            currentParentId = retryExisting.id;
                            continue;
                        }
                    }
                    console.error(`Error creating folder segment ${segment}:`, createError);
                    throw createError;
                }

                currentParentId = newFolder.id;
            }
        }

        return NextResponse.json({ folderId: currentParentId });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
