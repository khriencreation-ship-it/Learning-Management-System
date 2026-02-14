import { NextRequest, NextResponse } from 'next/server';
import { deleteTokens } from '@/lib/googleOAuth';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        // Get current user
        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        const body = await request.json();
        const { userId: bodyUserId } = body;

        let userId = user?.id;

        // Fallback to userId from body if session check fails
        if (!userId && bodyUserId) {
            userId = bodyUserId;
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Delete tokens from database
        await deleteTokens(userId);

        return NextResponse.json({
            success: true,
            message: 'Google account disconnected successfully',
        });
    } catch (error: any) {
        console.error('Error disconnecting Google account:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
