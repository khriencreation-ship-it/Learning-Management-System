import DashboardLayout from '@/components/admin/DashboardLayout';
import BroadcastsClient from '@/components/admin/broadcast/BroadcastsClient';

export const metadata = {
    title: 'Broadcasts | Khrien LMS',
    description: 'Manage and send system-wide or targeted broadcasts.',
};

export default function BroadcastPage() {
    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-8 px-6">
                <BroadcastsClient />
            </div>
        </DashboardLayout>
    );
}
