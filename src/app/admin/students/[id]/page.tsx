import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/admin/DashboardLayout';
import StudentProfileClient from '@/components/admin/students/StudentProfileClient';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

async function getStudentFullProfile(id: string) {
    try {
        // 1. Fetch Profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        // 1b. Fetch Auth User Metadata (for initial password)
        const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);
        const initialPassword = user?.user_metadata?.initial_password || null;

        if (profileError || !profile) return null;

        // 2. Fetch Direct Course Enrollments
        const { data: directEnrollments } = await supabaseAdmin
            .from('course_enrollments')
            .select('progress, enrolled_at, course_id, courses(*)')
            .eq('student_id', id);

        // 3. Fetch Cohort Assignments (For reporting/sidebar only)
        const { data: cohortAssignments } = await supabaseAdmin
            .from('cohort_students')
            .select('start_date, cohort_id, cohorts(*)')
            .eq('student_id', id);

        const cohorts = cohortAssignments?.map((a: any) => ({
            id: a.cohorts.id,
            name: a.cohorts.name,
            batch: a.cohorts.batch,
            status: a.cohorts.status,
            assignedAt: a.start_date ? new Date(a.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
        })) || [];

        // 4. Fetch Full Curriculum and Student Progress for Enrolled Courses
        const enrolledCourseIds = directEnrollments?.map(e => e.course_id) || [];

        const [curriculumData, studentProgressData] = await Promise.all([
            supabaseAdmin
                .from('course_modules')
                .select('*, module_items(*)')
                .in('course_id', enrolledCourseIds)
                .order('order_index', { ascending: true }),
            supabaseAdmin
                .from('student_progress')
                .select('item_id')
                .eq('student_id', id)
        ]);

        const completedItemIds = new Set(studentProgressData.data?.map(p => p.item_id) || []);

        // 5. Consolidate Courses with Progress
        const consolidatedCourses = (directEnrollments || []).map(enrollment => {
            const courseData = enrollment.courses as any;
            // Handle both object and array response from Supabase
            const course = Array.isArray(courseData) ? courseData[0] : courseData;

            if (!course) return null;

            const courseId = enrollment.course_id;

            // Filter modules for this course
            const modules = curriculumData.data
                ?.filter(m => m.course_id === courseId)
                .map(m => ({
                    id: m.id,
                    title: m.title,
                    summary: m.summary,
                    items: (m.module_items || [])
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((item: any) => ({
                            id: item.id,
                            title: item.title,
                            type: item.type,
                            isCompleted: completedItemIds.has(item.id)
                        }))
                })) || [];

            // Calculate Progress
            const allItems = modules.flatMap(m => m.items);
            const totalItems = allItems.length;
            const completedCount = allItems.filter(i => i.isCompleted).length;
            const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

            return {
                id: course.id,
                title: course.title,
                instructor: course.instructor,
                enrolledAt: new Date(enrollment.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                progress,
                curriculum: modules
            };
        }).filter((c): c is NonNullable<typeof c> => c !== null);

        return {
            id: profile.id,
            name: profile.full_name || 'Unknown',
            studentId: profile.identifier || 'N/A',
            email: profile.username || 'No Email',
            phone: profile.phone_number,
            status: profile.status,
            paymentStatus: profile.payment_status || 'unpaid',
            initialPassword: initialPassword,
            courses: consolidatedCourses,
            cohorts: cohorts
        };

    } catch (err) {
        console.error('Error fetching student profile:', err);
        return null;
    }
}

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const student = await getStudentFullProfile(id);

    if (!student) {
        notFound();
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-8 px-6">
                <StudentProfileClient student={student} />
            </div>
        </DashboardLayout>
    );
}
