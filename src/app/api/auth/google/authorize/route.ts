import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl } from '@/lib/googleOAuth';

export async function GET(request: NextRequest) {
    try {
        // Get user ID and optional course ID from query parameters
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const courseId = searchParams.get('courseId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Generate auth URL with user ID and optional course ID in state
        const authUrl = generateAuthUrl(userId, courseId || undefined);

        // Redirect to Google OAuth consent screen
        return NextResponse.redirect(authUrl);
    } catch (error: any) {
        console.error('Error generating auth URL:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
