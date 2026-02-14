import StudentCourseDetailsClient from '@/components/student/courses/StudentCourseDetailsClient';

export default async function StudentCourseDetailsPage(props: any) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { id } = params;
    const cohortId = searchParams.cohortId;

    return <StudentCourseDetailsClient id={id} cohortId={cohortId} />;
}
