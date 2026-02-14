'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/authClient';

export default function TutorWelcome() {
    const [name, setName] = useState('');

    useEffect(() => {
        async function fetchUser() {
            const user = await getCurrentUser();
            if (user?.name) {
                // Get first name only for a friendlier greeting
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
            {getGreeting()}, <span className="text-primary font-semibold">{name || 'Tutor'}</span>. Here's what's happening with your cohorts today.
        </p>
    );
}
