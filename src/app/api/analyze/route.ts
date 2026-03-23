import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { analyzeContent } from '@/lib/ai-detector';

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const student_id = searchParams.get('student_id');
        const assignment_id = searchParams.get('assignment_id');

        if (!student_id || !assignment_id) {
            return NextResponse.json({ error: 'Missing student_id or assignment_id' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('ai_analysis_results')
            .select('*')
            .eq('student_id', student_id)
            .eq('assignment_id', assignment_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error('Supabase GET Error:', error);
            return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
        }

        return NextResponse.json(data || null);
    } catch (error: any) {
        console.error('AI Analysis GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // 1. Supabase Auth Check (Tutor or Admin only)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check profile for role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['tutor', 'admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Access denied: Tutors/Admins only' }, { status: 403 });
        }

        // 2. Parse and Validate Request
        const body = await req.json();
        const { student_id, assignment_id, text: rawText, submission_source = "manual_input" } = body;

        if (!student_id || !assignment_id || !rawText) {
            return NextResponse.json({ error: 'Missing required fields: student_id, assignment_id, text' }, { status: 400 });
        }

        // 3. Process Text
        const cleanText = stripHtml(rawText);
        const words = cleanText.split(/\s+/).filter(Boolean);

        if (words.length < 20) {
            return NextResponse.json({ error: 'Text too short for reliable analysis. Minimum 20 words required.' }, { status: 400 });
        }

        // 4. Run Analysis
        const analysis = analyzeContent(student_id, assignment_id, cleanText, rawText);

        // 5. Upsert to Supabase
        const { data, error: upsertError } = await supabaseAdmin
            .from('ai_analysis_results')
            .upsert({
                student_id,
                assignment_id,
                final_score: analysis.final_score,
                verdict: analysis.verdict,
                confidence_level: analysis.confidence_level,
                breakdown: analysis.breakdown,
                flags: analysis.flags,
                total_word_count: analysis.total_word_count,
                submission_source,
                analyzed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'student_id,assignment_id'
            })
            .select()
            .single();

        if (upsertError) {
            console.error('Supabase Upsert Error:', upsertError);
            return NextResponse.json({ error: 'Failed to save analysis results' }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json({ error: 'Analysis failed', details: error.message }, { status: 500 });
    }
}
