'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/authClient';

export default function StudentWelcome() {
    const [name, setName] = useState('');

    useEffect(() => {
        async function fetchUser() {
            const user = await getCurrentUser();
            if (user?.name) {
                const firstName = user.name.split(' ')[0];
                setName(firstName);
            }
        }
        fetchUser();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <p className="text-gray-500 mt-1">
            {getGreeting()}, <span className="text-primary font-semibold">{name || 'Student'}</span>. Ready to continue your learning journey?
        </p>
    );
}
