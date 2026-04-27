'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotificationScanner() {
    const isScanning = useRef(false);

    useEffect(() => {
        const scan = async () => {
            if (isScanning.current) return;
            isScanning.current = true;

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const lastCheck = localStorage.getItem('last_notification_check');
                const now = new Date();
                
                // If checked less than 1 hour ago, skip
                if (lastCheck && (now.getTime() - new Date(lastCheck).getTime() < 3600000)) {
                    return;
                }

                const res = await fetch('/api/student/classroom/scanner', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (!res.ok) return;

                const { items } = await res.json();
                if (!items || items.length === 0) return;

                const unlockedItems: any[] = [];
                const upcomingDeadlines: any[] = [];

                items.forEach((item: any) => {
                    const meta = item.metadata || {};
                    
                    // Check Unlocks
                    if (meta.unlockDate) {
                        const unlockTime = new Date(meta.unlockDate).getTime();
                        const lastCheckTime = lastCheck ? new Date(lastCheck).getTime() : 0;
                        
                        if (unlockTime <= now.getTime() && unlockTime > lastCheckTime) {
                            unlockedItems.push(item);
                        }
                    }

                    // Check Deadlines (within 24 hours)
                    if (meta.deadline) {
                        const deadlineTime = new Date(meta.deadline).getTime();
                        const twentyFourHoursFromNow = now.getTime() + (24 * 60 * 60 * 1000);
                        
                        // If deadline is in the future AND within 24 hours
                        if (deadlineTime > now.getTime() && deadlineTime <= twentyFourHoursFromNow) {
                            // Only notify if we haven't notified for this specific deadline recently
                            const deadlineNotified = localStorage.getItem(`deadline_notified_${item.id}`);
                            if (!deadlineNotified) {
                                upcomingDeadlines.push(item);
                            }
                        }
                    }
                });

                // Generate Notifications
                if (unlockedItems.length > 0) {
                    const title = unlockedItems.length === 1 
                        ? 'New Content Unlocked' 
                        : `${unlockedItems.length} New Items Unlocked`;
                    const message = unlockedItems.length === 1
                        ? `"${unlockedItems[0].title}" is now available.`
                        : `New lessons and activities are now available in your courses.`;

                    await fetch('/api/student/notifications', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}` 
                        },
                        body: JSON.stringify({
                            title,
                            message,
                            type: 'content',
                            link: unlockedItems.length === 1 ? `/student/courses/${unlockedItems[0].course_id}` : '/student/courses'
                        })
                    });
                }

                for (const item of upcomingDeadlines) {
                    await fetch('/api/student/notifications', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}` 
                        },
                        body: JSON.stringify({
                            title: 'Upcoming Deadline',
                            message: `The deadline for "${item.title}" is in less than 24 hours.`,
                            type: 'deadline',
                            link: `/student/courses/${item.course_id}`
                        })
                    });
                    localStorage.setItem(`deadline_notified_${item.id}`, now.toISOString());
                }

                localStorage.setItem('last_notification_check', now.toISOString());

            } catch (error) {
                console.error('Notification scanner error:', error);
            } finally {
                isScanning.current = false;
            }
        };

        // Delay scan slightly to let dashboard load
        const timer = setTimeout(scan, 2000);
        return () => clearTimeout(timer);
    }, []);

    return null;
}
