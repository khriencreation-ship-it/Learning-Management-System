import DashboardLayout from '@/components/admin/DashboardLayout';
import CourseList from '@/components/admin/courses/CourseList';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

// Helper to format date
const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};

async function getCourses() {
    try {
        const { data: courses, error } = await supabaseAdmin
            .from('courses')
            .select('*, course_cohorts(count)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching courses:', error);
            return [];
        }

        return courses.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            instructor: c.instructor,
            image: c.image,
            topics: c.topics_count,
            lessons: c.lessons_count,
            quizzes: c.quizzes_count,
            assignments: c.assignments_count,
            status: c.status,
            publishedAt: c.published_at ? formatDate(c.published_at) : null,
            createdAt: c.created_at,
            code: c.code,
            cohortsCount: c.course_cohorts?.[0]?.count || 0
        }));
    } catch (err) {
        console.error('Unexpected error fetching courses:', err);
        return [];
    }
}

export default async function CoursesPage() {
    const courses = await getCourses();

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto py-4">
                <CourseList initialCourses={courses} />
            </div>
        </DashboardLayout>
    );
}
