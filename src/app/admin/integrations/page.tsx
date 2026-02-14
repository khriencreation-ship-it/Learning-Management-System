"use client";

import DashboardLayout from '@/components/admin/DashboardLayout';
import IntegrationsPageClient from '@/components/admin/IntegrationsPageClient';

export default function IntegrationsPage() {
    return (
        <DashboardLayout>
            <IntegrationsPageClient />
        </DashboardLayout>
    );
}
