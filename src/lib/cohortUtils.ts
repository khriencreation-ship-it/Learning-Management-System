export function getCohortStatus(startDate: Date, endDate: Date): 'active' | 'upcoming' | 'completed' {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
        return 'upcoming';
    } else if (now >= start && now <= end) {
        return 'active';
    } else {
        return 'completed';
    }
}
