import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const folderId = searchParams.get('folderId');

        let query = supabaseAdmin
            .from('media_files')
            .select('*')
            .order('created_at', { ascending: false });

        if (folderId === 'null' || folderId === 'root') {
            query = query.is('folder_id', null);
        } else if (folderId) {
            query = query.eq('folder_id', folderId);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let file: File | null = null;
        let folderId: string | null = null;
        let metadata: any = {};

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            file = formData.get('file') as File;
            folderId = formData.get('folderId') as string;
            
            // Allow passing metadata directly in form data
            if (formData.has('metadata')) {
                metadata = JSON.parse(formData.get('metadata') as string);
            } else {
                // Individual fields fallback
                metadata = {
                    filename: formData.get('filename'),
                    url: formData.get('url'),
                    type: formData.get('type'),
                    size: formData.get('size') ? parseInt(formData.get('size') as string) : undefined,
                    key: formData.get('key'),
                    bucket: formData.get('bucket') || 'media-library',
                };
            }
        } else if (contentType.includes('application/json')) {
            const body = await req.json();
            metadata = body;
            folderId = body.folderId;
        }

        const bucket = metadata.bucket || 'media-library';
        let finalMetadata: any = null;

        if (file) {
            // Standard Upload Path (Legacy/Small files)
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = fileName;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from(bucket)
                .upload(filePath, buffer, {
                    contentType: file.type,
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                // Bucket creation logic (kept for robustness)
                if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('The resource was not found')) {
                    const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucket, {
                        public: true,
                        fileSizeLimit: 524288000, // 500MB
                        allowedMimeTypes: ['image/*', 'video/*', 'application/pdf', 'text/*']
                    });
                    if (createBucketError) return NextResponse.json({ error: `Bucket missing: ${createBucketError.message}` }, { status: 500 });
                    
                    const { error: retryError } = await supabaseAdmin.storage.from(bucket).upload(filePath, buffer, { contentType: file.type });
                    if (retryError) return NextResponse.json({ error: `Retry failed: ${retryError.message}` }, { status: 500 });
                } else {
                    return NextResponse.json({ error: uploadError.message }, { status: 500 });
                }
            }

            const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

            finalMetadata = {
                filename: file.name,
                url: publicUrl,
                type: file.type.split('/')[0] || 'unknown',
                mime_type: file.type,
                size: file.size,
                key: filePath,
                bucket,
                folder_id: (folderId && folderId !== 'null' && folderId !== 'root') ? folderId : null
            };
        } else if (metadata.url && metadata.key) {
            // Metadata-only path (Pre-uploaded via client)
            finalMetadata = {
                filename: metadata.filename || 'unnamed',
                url: metadata.url,
                type: metadata.type || metadata.mime_type?.split('/')[0] || 'unknown',
                mime_type: metadata.mime_type || 'application/octet-stream',
                size: metadata.size || 0,
                key: metadata.key,
                bucket: metadata.bucket || 'media-library',
                folder_id: (folderId && folderId !== 'null' && folderId !== 'root') ? folderId : null
            };
        } else {
            return NextResponse.json({ error: 'No file or metadata provided' }, { status: 400 });
        }

        // Save Record to DB
        const { data: mediaRecord, error: dbError } = await supabaseAdmin
            .from('media_files')
            .insert([finalMetadata])
            .select()
            .single();

        if (dbError) {
            console.error('DB Insert error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json(mediaRecord, { status: 201 });

    } catch (error: any) {
        console.error('Media upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids } = body; // Array of media_file IDs

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // 1. Fetch files to get their storage keys and bucket
        const { data: filesToDelete, error: fetchError } = await supabaseAdmin
            .from('media_files')
            .select('id, key, bucket')
            .in('id', ids);

        if (fetchError) {
            console.error('Error fetching files for deletion:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!filesToDelete || filesToDelete.length === 0) {
            return NextResponse.json({ message: 'No files found to delete' });
        }

        // 2. Delete from Storage (Group by bucket)
        // Group files by bucket to optimize calls
        const filesByBucket: Record<string, string[]> = {};
        filesToDelete.forEach(file => {
            const bucket = file.bucket || 'media-library';
            if (!filesByBucket[bucket]) filesByBucket[bucket] = [];
            filesByBucket[bucket].push(file.key);
        });

        const deletePromises = Object.entries(filesByBucket).map(async ([bucket, keys]) => {
            if (keys.length > 0) {
                const { error: storageError } = await supabaseAdmin.storage
                    .from(bucket)
                    .remove(keys);
                if (storageError) {
                    console.error(`Error deleting from bucket ${bucket}:`, storageError);
                    // We continue to delete from DB even if storage fails? 
                    // Ideally yes, to avoid phantom DB records, but we log the storage orphan.
                }
            }
        });

        await Promise.all(deletePromises);

        // 3. Delete from Database
        const { error: deleteError } = await supabaseAdmin
            .from('media_files')
            .delete()
            .in('id', ids);

        if (deleteError) {
            console.error('Error deleting file records:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // 4. Auto-Cleanup References (Cohorts, Courses, Lessons)
        // We do this asynchronously or await it? Await to ensure consistency.
        // We need the URLs of the deleted files.
        // Re-construct URLs or we should have selected them in step 1.

        // Fetch URLs if we didn't (Step 1 only fetched id, key, bucket).
        // Actually, we can reconstruct publicUrl if we know the bucket.
        // Standard Supabase URL: https://[project].supabase.co/storage/v1/object/public/[bucket]/[key]
        const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // e.g. https://xyz.supabase.co

        if (projectUrl) {
            const cleanupPromises = filesToDelete.map(async (file) => {
                const bucketName = file.bucket || 'media-library';
                // Encode key segments but usually keys are safe-ish. 
                // Note: supabase storage urls are typically encoded.
                const url = `${projectUrl}/storage/v1/object/public/${bucketName}/${file.key}`;

                console.log(`[Auto-Cleanup] Cleaning references for: ${url}`);

                // A. Cohorts (Image)
                await supabaseAdmin.from('cohorts').update({ image: null }).eq('image', url);

                // B. Courses (Image)
                // Note: 'video_url' column existence is assumed based on builder route. 
                // If it doesn't exist, this might throw, but .update ignores missing columns? No, it errors.
                // Let's safe check or update separately if unsure. 
                // To be safe, we'll try updating image.
                await supabaseAdmin.from('courses').update({ image: null }).eq('image', url);
                // Try video_url separately, catch error if column missing
                try { await supabaseAdmin.from('courses').update({ video_url: null }).eq('video_url', url); } catch (e) { }

                // C. Module Items (Lessons)
                // Find affected items
                const { data: items } = await supabaseAdmin
                    .from('module_items')
                    .select('id, metadata, video_url')
                    .or(`video_url.eq.${url},metadata.ilike.%${file.key}%`); // fuzzy match on key to find candidates

                if (items && items.length > 0) {
                    for (const item of items) {
                        let changed = false;
                        let newMeta = { ...item.metadata };
                        let updates: any = {};

                        // Main video_url
                        if (item.video_url === url) {
                            updates.video_url = null;
                            changed = true;
                        }

                        // Metadata fields
                        if (newMeta.videoPreview === url) { newMeta.videoPreview = null; changed = true; }
                        if (newMeta.video_url === url) { newMeta.video_url = null; changed = true; }
                        if (newMeta.coverPreview === url) { newMeta.coverPreview = null; changed = true; }
                        if (newMeta.video === url) { newMeta.video = null; changed = true; } // Some legacy might store here

                        // Files array
                        if (newMeta.files && Array.isArray(newMeta.files)) {
                            const initialLen = newMeta.files.length;
                            newMeta.files = newMeta.files.filter((f: any) => f.url !== url);
                            if (newMeta.files.length !== initialLen) changed = true;
                        }

                        if (changed) {
                            updates.metadata = newMeta;
                            await supabaseAdmin.from('module_items').update(updates).eq('id', item.id);
                            console.log(`   -> Cleaned Module Item ${item.id}`);
                        }
                    }
                }
            });

            await Promise.allSettled(cleanupPromises);
        }

        return NextResponse.json({ message: 'Files deleted successfully' });

    } catch (error: any) {
        console.error('Delete handler error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
