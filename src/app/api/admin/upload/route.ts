import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const bucket = formData.get('bucket') as string || 'courses';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        // Convert file to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Ensure bucket exists
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
        if (listError) throw listError;

        const bucketExists = buckets.some(b => b.id === bucket);
        if (!bucketExists) {
            const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
                public: true,
                allowedMimeTypes: ['image/*'],
                fileSizeLimit: 5242880 // 5MB
            });
            if (createError) {
                console.error(`Failed to create bucket ${bucket}:`, createError);
                // Continue anyway, upload will fail with a better error if it's a permissions issue
            }
        }

        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase storage upload error:', error);
            // Provide a more descriptive error message to the user
            const message = error.message === 'Bucket not found'
                ? `The storage bucket "${bucket}" could not be found or created. Please create it manually in the Supabase dashboard.`
                : error.message;
            return NextResponse.json({ error: message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error('Upload handler error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
