"use client";

import DashboardLayout from '@/components/admin/DashboardLayout';
import CourseForm from '@/components/admin/courses/CourseForm';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

interface EditCourseClientProps {
    course: any;
}

export default function EditCourseClient({ course }: EditCourseClientProps) {
    const { toasts, removeToast } = useToast();

    return (
        <DashboardLayout>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
            <CourseForm
                initialData={course}
                isEdit={true}
                courseId={course.id}
            />
        </DashboardLayout>
    );
}
