'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, User } from '@/lib/authClient';

export default function AdminWelcome() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error('Failed to fetch user', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (loading) {
        return <p className="text-gray-500">Welcome to your platform control center.</p>;
    }

    return (
        <p className="text-gray-500">
            Welcome {user?.name ? <span className="font-semibold text-gray-900">{user.name}</span> : ''} to your Dashboard
        </p>
    );
}
