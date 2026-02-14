import StudentCohortDetailsClient from '@/components/student/cohorts/StudentCohortDetailsClient';

export default async function StudentCohortDetailsPage(props: any) {
    const params = await props.params;
    const { id } = params;

    return <StudentCohortDetailsClient id={id} />;
}
