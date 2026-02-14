import { supabase } from '@/lib/supabase';

export type UserRole = 'student' | 'tutor' | 'admin';

export interface LoginCredentials {
    identifier: string;
    password: string;
}

export interface User {
    id: string;
    name: string;
    role: UserRole;
    identifier: string;
    profilePicture?: string;
    status: string;
    forceChangePassword?: boolean;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    user: User | null;
    token: string | null;
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<User | null> {
    try {
        let emailToLogin = credentials.identifier;

        // If identifier is NOT an email (e.g., STU-123), we need to find the email first
        if (!credentials.identifier.includes('@')) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('username')
                .eq('identifier', credentials.identifier)
                .single();

            if (profileError || !profile || !profile.username) {
                console.error('Login error: Identifier not found or no email linked');
                return null;
            }

            // use the email stored in the profile (username column)
            emailToLogin = profile.username;
        }

        // Use Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailToLogin,
            password: credentials.password,
        });

        // If direct email failed, and we didn't try the constructed one yet (i.e. input WAS email)
        if (error && credentials.identifier.includes('@')) {
            console.error('Login error:', error.message);
            return null;
        } else if (error) {
            // If we constructed an email and it failed, maybe they DID use an email but typed it wrong?
            // Or maybe our constructed email logic is wrong.
            // Let's try to just use the input if the constructed one failed? No, we know it failed.
            console.error('Login error:', error.message);
            return null;
        }

        if (data.user) {
            // Fetch profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                // Return basic user info from auth if profile missing
                return {
                    id: data.user.id,
                    name: data.user.user_metadata.full_name || 'User',
                    role: (data.user.user_metadata.role as UserRole) || 'student',
                    identifier: data.user.user_metadata.identifier || credentials.identifier,
                    status: 'active',
                    forceChangePassword: data.user.user_metadata.force_change_password
                };
            }

            return {
                id: profile.id,
                name: profile.full_name,
                role: profile.role || 'student',
                identifier: profile.identifier || data.user.email || '',
                profilePicture: profile.avatar_url,
                status: profile.status || 'active',
                forceChangePassword: data.user.user_metadata?.force_change_password
            };
        }

        return null;
    } catch (err) {
        console.error('Unexpected login error:', err);
        return null;
    }
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user) {
            return null;
        }

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            return {
                id: session.user.id,
                name: session.user.user_metadata.full_name || 'User',
                role: (session.user.user_metadata.role as UserRole) || 'student',
                identifier: session.user.user_metadata.identifier || session.user.email || '',
                status: 'active',
                forceChangePassword: session.user.user_metadata.force_change_password
            };
        }

        return {
            id: profile.id,
            name: profile.full_name,
            role: profile.role || 'student',
            identifier: profile.identifier || session.user.email || '',
            profilePicture: profile.avatar_url,
            status: profile.status || 'active',
            forceChangePassword: session.user.user_metadata.force_change_password
        };

    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem('auth_token'); // Clean up old mock tokens just in case
    localStorage.removeItem('user_data');
}

/**
 * Detect user role from identifier
 */
export function detectUserRole(identifier: string): UserRole {
    const trimmed = identifier.trim();

    if (trimmed.includes('@')) {
        return 'admin';
    }

    if (trimmed.toUpperCase().startsWith('STU-')) {
        return 'student';
    }

    if (trimmed.toUpperCase().startsWith('TUT-')) {
        return 'tutor';
    }

    return 'student';
}

/**
 * Get role-specific welcome message
 */
export function getRoleWelcomeMessage(role: UserRole, name: string): string {
    const messages = {
        student: `Welcome back, ${name}! Ready to continue your learning journey?`,
        tutor: `Welcome, ${name}! Your cohort is waiting for you.`,
        admin: `Welcome back, Admin! Platform control center loading...`,
    };

    return messages[role];
}

/**
 * Get role-specific error message
 */
export function getRoleErrorMessage(role: UserRole): string {
    const messages = {
        student: 'Invalid Student ID or password. Need help? Contact your tutor.',
        tutor: 'Invalid Tutor ID or password. Contact admin support.',
        admin: 'Invalid email or password. Check your credentials.',
    };

    return messages[role];
}

/**
 * Get dashboard route for role
 */
export function getRoleDashboardRoute(role: UserRole): string {
    const routes = {
        student: '/student/dashboard',
        tutor: '/tutor/dashboard',
        admin: '/admin/dashboard',
    };

    return routes[role];
}

