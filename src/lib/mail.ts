import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailProps {
    email: string;
    name: string;
    identifier: string;
    password: string;
    role: string;
}

/**
 * Generates the HTML content for the welcome email.
 */
function generateWelcomeEmailHtml({ name, identifier, password, role }: WelcomeEmailProps) {
    const isStudent = role === 'student';
    const roleLabel = isStudent ? 'Student' : 'Tutor';
    const tagline = isStudent 
        ? 'Your learning journey starts here' 
        : 'Join our mission to empower learners';
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lms.khrien.com'}/login`;

    const welcomeMessage = isStudent
        ? `We are thrilled to have you at Khrien Academy. Your account has been successfully created. You can now access your courses, submit assignments, and track your grades all in one place.`
        : `Welcome to the team! Your tutor account has been successfully created. You can now manage your courses, track student progress, and share announcements with your cohorts.`;

    const features = isStudent
        ? `<li>Access all your enrolled courses</li><li>Participate in live classes</li><li>Submit assignments and view feedback</li>`
        : `<li>Manage your course content</li><li>Monitor student performance</li><li>Post announcements to your students</li>`;

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #7c3aed; font-size: 28px; font-weight: 800; margin: 0;">Khrien Academy</h1>
                <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">${tagline}</p>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 24px; padding: 32px; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px;">Welcome aboard, ${name}!</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
                    ${welcomeMessage}
                </p>

                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">What you can do in the portal:</h3>
                    <ul style="font-size: 14px; color: #4b5563; padding-left: 20px; margin: 0;">
                        ${features}
                    </ul>
                </div>

                <div style="background-color: #f9fafb; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #f3f4f6;">
                    <div style="margin-bottom: 12px;">
                        <span style="display: block; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Your ${roleLabel} ID</span>
                        <span style="font-size: 18px; font-weight: 700; color: #111827;">${identifier}</span>
                    </div>
                    <div>
                        <span style="display: block; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Default Password</span>
                        <span style="font-size: 18px; font-weight: 700; color: #111827;">${password}</span>
                    </div>
                </div>

                <a href="${loginUrl}" style="display: block; width: 100%; padding: 14px; background-color: #7c3aed; color: #ffffff; text-align: center; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; margin-bottom: 24px;">
                    Login to Portal
                </a>

                <p style="font-size: 14px; color: #ef4444; font-style: italic; background-color: #fef2f2; padding: 12px; border-radius: 8px; text-align: center;">
                    Important: For your security, you will be required to change this password upon your first login.
                </p>
            </div>

            <div style="text-align: center; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 24px;">
                <p style="font-size: 14px; color: #9ca3af; margin: 0;">
                    &copy; ${new Date().getFullYear()} Khrien Academy. All rights reserved.
                </p>
            </div>
        </div>
    `;
}

/**
 * Sends a welcome email to a newly created user (student or tutor).
 */
export async function sendWelcomeEmail(props: WelcomeEmailProps) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping email sending.');
        return { success: false, error: 'Missing API Key' };
    }

    try {
        const html = generateWelcomeEmailHtml(props);
        const { data, error } = await resend.emails.send({
            from: 'Khrien Academy <hello@khrien.com>',
            to: [props.email],
            subject: `Welcome to Khrien Academy, ${props.name}!`,
            html
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Mail Exception:', err);
        return { success: false, error: err };
    }
}

/**
 * Sends a batch of welcome emails in a single API call.
 */
export async function sendWelcomeEmailsBatch(emails: WelcomeEmailProps[]) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping email sending.');
        return { success: false, error: 'Missing API Key' };
    }

    if (!emails.length) return { success: true, data: [] };

    try {
        const batchData = emails.map(props => ({
            from: 'Khrien Academy <hello@khrien.com>',
            to: [props.email],
            subject: `Welcome to Khrien Academy, ${props.name}!`,
            html: generateWelcomeEmailHtml(props)
        }));

        const { data, error } = await resend.batch.send(batchData);

        if (error) {
            console.error('Resend Batch Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Mail Batch Exception:', err);
        return { success: false, error: err };
    }
}
