import DashboardLayout from '@/components/admin/DashboardLayout';
import TutorListClient from '@/components/admin/tutors/TutorListClient';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

async function getTutors() {
    try {
        const { data: tutors, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('role', 'tutor')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching tutors:', error);
            return [];
        }

        return tutors.map((s: any) => ({
            id: s.id,
            name: s.full_name || 'Unknown',
            tutorId: s.identifier || 'N/A',
            email: s.username || 'No Email',
            phone: s.phone_number,
            paymentStatus: s.payment_status,
            status: s.status
        }));
    } catch (err) {
        console.error('Unexpected error fetching tutors:', err);
        return [];
    }
}

export default async function TutorsPage() {
    const tutors = await getTutors();

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto py-8 px-6">
                <TutorListClient initialTutors={tutors} />
            </div>
        </DashboardLayout>
    );
}
