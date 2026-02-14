import DashboardLayout from '@/components/admin/DashboardLayout';
import CourseForm from '@/components/admin/courses/CourseForm';

export default function CreateCoursePage() {
    return (
        <DashboardLayout>
            <CourseForm />
        </DashboardLayout>
    );
}
