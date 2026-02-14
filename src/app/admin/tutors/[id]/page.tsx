import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/admin/DashboardLayout';
import TutorProfileClient from '@/components/admin/tutors/TutorProfileClient';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

async function getTutorFullProfile(id: string) {
    try {
        if (!id) return null;

        // 1. Fetch Profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (profileError || !profile) {
            console.error('Profile fetch error:', profileError);
            return null;
        }

        // 2. Fetch Cohort Assignments from cohort_tutors
        // Note: cohort_tutors might not have 'assigned_at' based on assign-tutors route.
        const { data: cohortAssignments, error: cohortError } = await supabaseAdmin
            .from('cohort_tutors')
            .select('cohort_id, cohorts(*)')
            .eq('tutor_id', id);

        if (cohortError) {
            console.error('Cohort assignment fetch error:', cohortError);
        }

        // Safely map cohorts
        const cohorts = (cohortAssignments || [])
            .filter((a: any) => a && a.cohorts) // Ensure joined cohort data exists
            .map((a: any) => ({
                id: a.cohorts.id,
                name: a.cohorts.name || 'Unknown Cohort',
                batch: a.cohorts.batch || 'N/A',
                status: a.cohorts.status || 'unknown',
                assignedAt: 'N/A'
            }));

        // 3. Fetch Assigned Courses directly by Instructor Name
        // The system links courses to tutors via the 'instructor' text field matching the tutor's full name.
        let courses: any[] = [];

        if (profile.full_name) {
            const { data: directCourses, error: courseError } = await supabaseAdmin
                .from('courses')
                .select('*')
                .eq('instructor', profile.full_name);

            if (courseError) {
                console.error('Direct course fetch error:', courseError);
            }

            if (directCourses) {
                courses = directCourses.map((course: any) => ({
                    id: course.id,
                    title: course.title || 'Untitled Course',
                    code: course.code || 'N/A',
                    instructor: course.instructor || 'Unknown',
                    image: course.image || '',
                    lessonsCount: course.lessons_count || 0
                }));
            }
        }

        // 1b. Fetch Auth User Metadata (for initial password)
        const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);
        const initialPassword = user?.user_metadata?.initial_password || null;

        return {
            id: profile.id,
            name: profile.full_name || 'Unknown',
            tutorId: profile.identifier || 'N/A',
            email: profile.username || 'No Email',
            phone: profile.phone_number,
            status: profile.status,
            initialPassword: initialPassword,
            cohorts: cohorts,
            courses: courses
        };

    } catch (err) {
        console.error('Error fetching tutor profile:', err);
        return null;
    }
}

export default async function TutorProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const tutor = await getTutorFullProfile(id);

    if (!tutor) {
        notFound();
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-8 px-6">
                <TutorProfileClient tutor={tutor} />
            </div>
        </DashboardLayout>
    );
}
