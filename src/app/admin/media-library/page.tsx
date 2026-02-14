import MediaLibraryClient from '@/components/admin/media/MediaLibraryClient';
import DashboardLayout from '@/components/admin/DashboardLayout';

export default function MediaLibraryPage() {
    return (
        <DashboardLayout>
            <MediaLibraryClient />
        </DashboardLayout>
    );
}
