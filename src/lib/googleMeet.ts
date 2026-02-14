import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleOAuth';

/**
 * Generate a Google Meet link using user's OAuth credentials
 * @param userId - User ID to get OAuth tokens for
 * @param title - Meeting title
 * @param description - Meeting description
 * @param startDateTime - ISO 8601 datetime string (e.g., "2026-02-19T17:00:00")
 * @param durationMinutes - Meeting duration in minutes
 * @returns Meeting link and event ID
 */
export async function generateGoogleMeetLink(
    userId: string,
    title: string,
    description: string,
    startDateTime: string,
    durationMinutes: number
): Promise<{ meetingLink: string; eventId: string }> {
    try {
        // Get authenticated OAuth2 client for the user
        const auth = await getAuthenticatedClient(userId);

        // Initialize Calendar API
        const calendar = google.calendar({ version: 'v3', auth });

        // Calculate end time
        const startDate = new Date(startDateTime);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

        // Create calendar event with Google Meet
        const event = {
            summary: title,
            description: description || 'Live class session',
            start: {
                dateTime: startDate.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: 'UTC',
            },
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
        };

        // Insert event with conference data
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1,
        });

        const meetingLink = response.data.conferenceData?.entryPoints?.find(
            (ep) => ep.entryPointType === 'video'
        )?.uri;

        if (!meetingLink) {
            throw new Error('Failed to generate Google Meet link. Please make sure you have authorized the app to create calendar events.');
        }

        return {
            meetingLink,
            eventId: response.data.id || '',
        };
    } catch (error: any) {
        console.error('Error generating Google Meet link:', error);

        // Provide more helpful error messages
        if (error.message?.includes('No tokens found')) {
            throw new Error('Please connect your Google account first');
        }
        if (error.message?.includes('invalid_grant')) {
            throw new Error('Your Google authorization has expired. Please reconnect your account');
        }

        throw new Error(`Failed to generate Google Meet link: ${error.message}`);
    }
}
