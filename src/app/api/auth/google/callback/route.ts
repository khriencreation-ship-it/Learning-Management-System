import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, storeTokens } from '@/lib/googleOAuth';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Handle OAuth errors
        if (error) {
            return NextResponse.redirect(
                new URL(`/admin/courses?error=oauth_${error}`, request.url)
            );
        }

        if (!code) {
            return NextResponse.redirect(
                new URL('/admin/courses?error=no_code', request.url)
            );
        }

        if (!state) {
            return NextResponse.redirect(
                new URL('/admin/courses?error=no_state', request.url)
            );
        }

        // Decode user ID and course ID from state parameter
        let userId: string;
        let courseId: string | undefined;
        try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
            userId = stateData.userId;
            courseId = stateData.courseId;

            if (!userId) {
                throw new Error('User ID not found in state');
            }
        } catch (err) {
            console.error('Error decoding state:', err);
            return NextResponse.redirect(
                new URL('/admin/courses?error=invalid_state', request.url)
            );
        }

        console.log('OAuth Callback - User ID from state:', userId);
        console.log('OAuth Callback - Course ID from state:', courseId);

        // Exchange code for tokens
        const tokenData = await exchangeCodeForTokens(code);

        // Store tokens in database
        await storeTokens(
            userId,
            tokenData.accessToken,
            tokenData.refreshToken,
            tokenData.expiryDate,
            tokenData.scope,
            tokenData.email
        );

        console.log('OAuth tokens stored successfully for user:', userId);

        // Redirect back to integrations page
        const redirectUrl = '/admin/integrations?google_connected=true';

        return NextResponse.redirect(
            new URL(redirectUrl, request.url)
        );
    } catch (error: any) {
        console.error('Error in OAuth callback:', error);
        return NextResponse.redirect(
            new URL(`/admin/courses?error=${encodeURIComponent(error.message)}`, request.url)
        );
    }
}
