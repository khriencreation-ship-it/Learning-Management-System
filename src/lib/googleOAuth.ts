import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Initialize OAuth2 client
 */
export function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URI
    );
}

/**
 * Generate authorization URL for OAuth flow with user state
 */
export function generateAuthUrl(userId: string, courseId?: string): string {
    const oauth2Client = getOAuth2Client();

    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    // Encode user ID and optional course ID in state parameter
    const state = Buffer.from(JSON.stringify({ userId, courseId })).toString('base64');

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent', // Force consent to get refresh token
        state, // Pass user ID and course ID through OAuth flow
    });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
    const oauth2Client = getOAuth2Client();

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to obtain tokens');
    }

    // Get user email
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date || Date.now() + 3600 * 1000,
        scope: tokens.scope || '',
        email: userInfo.data.email || '',
    };
}

/**
 * Store tokens in database
 */
export async function storeTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiryDate: number,
    scope: string,
    email: string
) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
        .from('google_tokens')
        .upsert({
            user_id: userId,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expiry: new Date(expiryDate).toISOString(),
            scope,
            email,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id'
        });

    if (error) {
        throw new Error(`Failed to store tokens: ${error.message}`);
    }
}

/**
 * Get tokens from database
 */
export async function getTokens(userId: string) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
        .from('google_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiryDate: new Date(data.token_expiry).getTime(),
        scope: data.scope,
        email: data.email,
    };
}

/**
 * Refresh access token if expired
 */
export async function refreshAccessToken(userId: string) {
    const tokens = await getTokens(userId);

    if (!tokens) {
        throw new Error('No tokens found for user');
    }

    // Check if token is expired (with 5 min buffer)
    const now = Date.now();
    if (tokens.expiryDate > now + 5 * 60 * 1000) {
        // Token is still valid
        return tokens.accessToken;
    }

    // Refresh the token
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        refresh_token: tokens.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
    }

    // Update database with new access token
    await storeTokens(
        userId,
        credentials.access_token,
        tokens.refreshToken,
        credentials.expiry_date || Date.now() + 3600 * 1000,
        tokens.scope,
        tokens.email
    );

    return credentials.access_token;
}

/**
 * Delete tokens from database
 */
export async function deleteTokens(userId: string) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
        .from('google_tokens')
        .delete()
        .eq('user_id', userId);

    if (error) {
        throw new Error(`Failed to delete tokens: ${error.message}`);
    }
}

/**
 * Get OAuth2 client with user's credentials
 */
export async function getAuthenticatedClient(userId: string) {
    const accessToken = await refreshAccessToken(userId);

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        access_token: accessToken,
    });

    return oauth2Client;
}
