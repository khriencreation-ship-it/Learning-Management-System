import DashboardLayout from '@/components/admin/DashboardLayout';
import StudentListClient from '@/components/admin/students/StudentListClient';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

async function getStudents(page: number = 1, pageSize: number = 25) {
    try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: students, error, count } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('role', 'student')
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching students:', error);
            return { students: [], totalCount: 0 };
        }

        const mappedStudents = (students || []).map((s: any) => ({
            id: s.id,
            name: s.full_name || 'Unknown',
            studentId: s.identifier || 'N/A',
            email: s.username || 'No Email',
            phone: s.phone_number,
            paymentStatus: s.payment_status,
            status: s.status
        }));

        return { students: mappedStudents, totalCount: count || 0 };
    } catch (err) {
        console.error('Unexpected error fetching students:', err);
        return { students: [], totalCount: 0 };
    }
}

export default async function StudentsPage(props: any) {
    const searchParams = await props.searchParams;
    const page = parseInt(searchParams.page as string) || 1;
    const pageSize = 25;

    const { students, totalCount } = await getStudents(page, pageSize);

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto py-8 px-6">
                <StudentListClient 
                    initialStudents={students} 
                    totalCount={totalCount}
                    currentPage={page}
                    pageSize={pageSize}
                />
            </div>
        </DashboardLayout>
    );
}
