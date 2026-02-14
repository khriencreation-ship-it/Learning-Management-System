import DashboardLayout from '@/components/admin/DashboardLayout';
import { supabaseAdmin } from '@/lib/supabase-admin';
import CohortListClient from '@/components/admin/cohorts/CohortListClient';
import { getCohortStatus } from '@/lib/cohortUtils';

export const revalidate = 0;

interface ICohort {
    id: string;
    _id?: string; // For compatibility
    name: string;
    batch: string;
    image?: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: string;
    studentsCount: number;
    tutorsCount: number;
    coursesCount: number;
}

// Helper to format date
const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};

async function getCohorts() {
    try {
        const { data: cohorts, error } = await supabaseAdmin
            .from('cohorts')
            .select(`
                *,
                cohort_students (count),
                cohort_tutors (count),
                course_cohorts (count)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cohorts:', error);
            return [];
        }

        return cohorts.map((c: any) => ({
            id: c.id,
            name: c.name,
            batch: c.batch,
            image: c.image,
            description: c.description,
            startDate: formatDate(c.start_date),
            endDate: formatDate(c.end_date),
            status: getCohortStatus(c.start_date, c.end_date), // Dynamic status calculation
            studentsCount: c.cohort_students?.[0]?.count || 0,
            tutorsCount: c.cohort_tutors?.[0]?.count || 0,
            coursesCount: c.course_cohorts?.[0]?.count || 0
        }));
    } catch (err) {
        console.error('Unexpected error fetching cohorts:', err);
        return [];
    }
}

export default async function CohortsPage() {
    const cohorts = await getCohorts();

    return (
        <DashboardLayout>
            <CohortListClient initialCohorts={cohorts} />
        </DashboardLayout>
    );
}
