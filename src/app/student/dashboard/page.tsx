'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User } from '@/lib/authClient';
import StudentDashboardClient from './StudentDashboardClient';

export default function StudentDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }

            if (currentUser.forceChangePassword) {
                router.push('/change-password');
                return;
            }

            setUser(currentUser);
        };
        checkUser();
    }, [router]);

    if (!user) return null;

    return <StudentDashboardClient />;
}
