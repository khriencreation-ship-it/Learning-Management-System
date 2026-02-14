
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch the quiz item
        const { data: item, error } = await supabaseAdmin
            .from('module_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !item) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

        const searchParams = req.nextUrl.searchParams;
        const cohortId = searchParams.get('cohortId');

        // Sanitize - remove correctAnswer from questions
        const metadata = item.metadata || {};
        const questions = metadata.questions || [];
        const maxAttempts = parseInt(metadata.maxAttempts || '1');

        const sanitizedQuestions = questions.map((q: any) => {
            const { correctAnswer, ...rest } = q;
            return rest;
        });

        // Check submissions (scoped by cohort)
        let querySub = supabaseAdmin
            .from('quiz_submissions')
            .select('*')
            .eq('student_id', user.id)
            .eq('quiz_id', id);

        if (cohortId && cohortId !== 'null' && cohortId !== 'undefined') {
            querySub = querySub.eq('cohort_id', cohortId);
        } else {
            querySub = querySub.is('cohort_id', null);
        }

        const { data: submissions, error: subError } = await querySub.order('created_at', { ascending: false });

        const attemptsCount = submissions?.length || 0;

        // Check if passed
        const passedSubmission = submissions?.find((s: any) => s.passed);

        // Determine if we should show previous results (Review Mode)
        // If passed OR attempts >= maxAttempts, user can review.
        // We return the "best" or "latest" submission for review.
        let latestSubmission = submissions?.[0] || null;

        // If user shouldn't see answers yet (failed but has retries), we mask the answers in the submission we return
        // BUT, usually we only use this endpoint to check "status".
        // If the user has a "passed" submission, we always return it so they can see they passed.
        let returnSubmission = passedSubmission || latestSubmission;

        if (returnSubmission) {
            const hasRetriesLeft = attemptsCount < maxAttempts;
            const canRetry = !passedSubmission && hasRetriesLeft;

            if (canRetry) {
                // If they can retry, we shouldn't show them the answers/results of their failed attempt?
                // The user said: "if ... student fails dont show them the correct answers yet... modal showing score... retry button"
                // So if they refresh the page, they should probably see "Attempt 1 Failed".
                // We will return the submission but maybe strip the 'results' detail if we are being strict,
                // OR we trust the frontend to hide it. For security, let's strip `results` if canRetry is true.
                if (returnSubmission.results) {
                    returnSubmission.results = null; // Hide detailed breakdown
                }
            }
        }

        return NextResponse.json({
            ...item,
            metadata: {
                ...metadata,
                questions: sanitizedQuestions
            },
            stats: {
                attemptsCount,
                maxAttempts,
                passed: !!passedSubmission,
                canRetry: !passedSubmission && attemptsCount < maxAttempts
            },
            submission: returnSubmission
        });

    } catch (error: any) {
        console.error('Quiz fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
