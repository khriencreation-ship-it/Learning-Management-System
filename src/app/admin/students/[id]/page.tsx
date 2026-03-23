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

        // 3. Fetch Cohort Assignments
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

        // 3b. Fetch courses from assigned cohorts (to catch progress for cohort-only enrollments)
        const cohortIds = cohortAssignments?.map(a => a.cohort_id) || [];
        let cohortLinkedCourses: any[] = [];
        if (cohortIds.length > 0) {
            const { data: cc } = await supabaseAdmin
                .from('course_cohorts')
                .select('course_id, courses(*)')
                .in('cohort_id', cohortIds);
            cohortLinkedCourses = cc || [];
        }

        // 4. Unique list of enrolled courses (Direct + Cohort)
        const courseMap = new Map<string, any>();

        // Add direct enrollments first
        directEnrollments?.forEach(enr => {
            const courseData = Array.isArray(enr.courses) ? enr.courses[0] : enr.courses;
            if (courseData) {
                courseMap.set(enr.course_id, {
                    ...courseData,
                    enrolledAt: enr.enrolled_at,
                    course_id: enr.course_id
                });
            }
        });

        // Add cohort-linked courses (don't overwrite direct if already present)
        cohortLinkedCourses.forEach(cc => {
            if (!courseMap.has(cc.course_id)) {
                const courseData = Array.isArray(cc.courses) ? cc.courses[0] : cc.courses;
                if (courseData) {
                    const cohortAssign = cohortAssignments?.find(a => a.cohort_id === cc.cohort_id);
                    courseMap.set(cc.course_id, {
                        ...courseData,
                        enrolledAt: cohortAssign?.start_date || new Date().toISOString(),
                        course_id: cc.course_id
                    });
                }
            }
        });

        const enrolledCourseIds = Array.from(courseMap.keys());

        // 5. Fetch Full Curriculum and Student Progress
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
                .eq('is_completed', true) // FIX: Only count completed items
        ]);

        const completedItemIds = new Set(studentProgressData.data?.map(p => p.item_id) || []);

        // 6. Consolidate Courses with Progress
        const consolidatedCourses = enrolledCourseIds.map(courseId => {
            const course = courseMap.get(courseId);
            if (!course) return null;

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
                            isCompleted: completedItemIds.has(item.id),
                            metadata: item.metadata
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
                enrolledAt: new Date(course.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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
