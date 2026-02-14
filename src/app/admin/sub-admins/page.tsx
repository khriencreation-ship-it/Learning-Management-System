
import SubAdminListClient from '@/components/admin/sub-admins/SubAdminListClient';
import { Shield } from 'lucide-react';
import DashboardLayout from '@/components/admin/DashboardLayout';

export default function SubAdminsPage() {
    return (
        <DashboardLayout>
            <div className="p-8 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 text-primary rounded-xl">
                                <Shield size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                Sub Admins
                            </h1>
                        </div>
                        <p className="text-gray-500 text-lg">
                            Manage administrative access and roles.
                        </p>
                    </div>
                </div>

                {/* List */}
                <SubAdminListClient />
            </div>
        </DashboardLayout>
    );
}
