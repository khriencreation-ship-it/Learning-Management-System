import DashboardLayout from '@/components/admin/DashboardLayout';
import StudentListClient from '@/components/admin/students/StudentListClient';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

async function getStudents() {
    try {
        const { data: students, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching students:', error);
            return [];
        }

        return students.map((s: any) => ({
            id: s.id,
            name: s.full_name || 'Unknown',
            studentId: s.identifier || 'N/A',
            email: s.username || 'No Email',
            phone: s.phone_number,
            paymentStatus: s.payment_status,
            status: s.status
        }));
    } catch (err) {
        console.error('Unexpected error fetching students:', err);
        return [];
    }
}

export default async function StudentsPage() {
    const students = await getStudents();

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto py-8 px-6">
                <StudentListClient initialStudents={students} />
            </div>
        </DashboardLayout>
    );
}
