import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/googleOAuth';

export async function GET(request: NextRequest) {
    try {
        // Get user ID from query parameter
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { connected: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Check if user has tokens
        const tokens = await getTokens(userId);

        if (!tokens) {
            return NextResponse.json({
                connected: false,
            });
        }

        return NextResponse.json({
            connected: true,
            email: tokens.email,
        });
    } catch (error: any) {
        console.error('Error checking Google connection status:', error);
        return NextResponse.json(
            { connected: false, error: error.message },
            { status: 500 }
        );
    }
}
