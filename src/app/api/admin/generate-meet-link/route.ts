import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleMeetLink } from '@/lib/googleMeet';
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
        const { title, description, date, time, duration, userId: bodyUserId } = body;

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

        // Validate required fields
        if (!title || !date || !time || !duration) {
            return NextResponse.json(
                { error: 'Missing required fields: title, date, time, duration' },
                { status: 400 }
            );
        }

        // Combine date and time into ISO 8601 format
        const startDateTime = `${date}T${time}:00`;

        // Generate Google Meet link using user's OAuth tokens
        const { meetingLink, eventId } = await generateGoogleMeetLink(
            userId,
            title,
            description || '',
            startDateTime,
            parseInt(duration)
        );

        return NextResponse.json({
            success: true,
            meetingLink,
            eventId,
        });
    } catch (error: any) {
        console.error('Error in generate-meet-link API:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate Google Meet link',
                details: error.message
            },
            { status: 500 }
        );
    }
}
