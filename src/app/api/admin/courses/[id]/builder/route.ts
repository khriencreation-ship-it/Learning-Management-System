
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper to generate a mock Google Meet link
function generateMeetLink() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // params is a Promise in Next.js 15+ usually, depending on version. Assuming standard Next 14/15 pattern.
) {
    try {
        const { id } = await params; // Await params if it's a promise, safe for recent Next.js versions
        const courseId = id;
        const body = await req.json();
        const { modules, courseSettings } = body;

        // 0. Update Course Settings (Image, Video, Enrollments) if provided
        console.log('--- BUILDER SAVE START ---');
        console.log('Course ID:', courseId);
        console.log('Received courseSettings:', JSON.stringify(courseSettings, null, 2));

        if (courseSettings) {
            const updates: any = {};
            if (courseSettings.image !== undefined) updates.image = courseSettings.image;
            if (courseSettings.video !== undefined) updates.video_url = courseSettings.video;

            console.log('Applying course updates:', updates);

            // Update basic course info
            if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabaseAdmin
                    .from('courses')
                    .update(updates)
                    .eq('id', courseId);

                if (updateError) {
                    console.error('CRITICAL: Error updating courses table:', updateError);
                    throw updateError;
                }
            }

            // Enrollments Saving
            console.log('Saving enrollments...');
            if (courseSettings.students && Array.isArray(courseSettings.students)) {
                // Clear existing
                const { error: delError } = await supabaseAdmin
                    .from('course_enrollments')
                    .delete()
                    .eq('course_id', courseId);

                if (delError) console.error('Error clearing student enrollments:', delError);

                // Insert new
                if (courseSettings.students.length > 0) {
                    const studentInserts = courseSettings.students.map((studentId: string) => ({
                        course_id: courseId,
                        student_id: studentId,
                        status: 'active'
                    }));

                    const { error: studentError } = await supabaseAdmin
                        .from('course_enrollments')
                        .insert(studentInserts);

                    if (studentError) console.error('Error saving student enrollments:', studentError);
                }
            }

            // Cohorts Saving
            if (courseSettings.cohorts && Array.isArray(courseSettings.cohorts)) {
                // Clear existing
                await supabaseAdmin
                    .from('course_cohorts')
                    .delete()
                    .eq('course_id', courseId);

                // Insert new
                if (courseSettings.cohorts.length > 0) {
                    const cohortInserts = courseSettings.cohorts.map((cohortId: string) => ({
                        course_id: courseId,
                        cohort_id: cohortId
                    }));

                    const { error: cohortError } = await supabaseAdmin
                        .from('course_cohorts')
                        .insert(cohortInserts);

                    if (cohortError) console.error('Error saving assigned cohorts:', cohortError);
                }
            }
        }

        if (!modules || !Array.isArray(modules)) {
            // It's possible we only wanted to save settings? For now assume modules are required or at least empty array
            if (!modules && courseSettings) {
                return NextResponse.json({ success: true });
            }
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // 1. Delete existing modules for this course
        // Using delete-replace strategy. Because of CASCADE, this deletes items too.
        console.log('Clearing existing modules/items...');
        const { error: deleteError } = await supabaseAdmin
            .from('course_modules')
            .delete()
            .eq('course_id', courseId);

        if (deleteError) {
            console.error('Error deleting existing modules:', deleteError);
            return NextResponse.json({ error: 'Failed to clear existing curriculum', details: deleteError.message }, { status: 500 });
        }

        // 2. Insert new modules and items
        console.log(`Inserting ${modules.length} modules...`);

        for (const [mIndex, module] of modules.entries()) {
            console.log(`Processing module ${mIndex + 1}: ${module.title}`);
            // Create Module
            const { data: newModule, error: moduleError } = await supabaseAdmin
                .from('course_modules')
                .insert({
                    course_id: courseId,
                    title: module.title || 'Untitled Module',
                    summary: module.summary || '',
                    order_index: mIndex
                })
                .select()
                .single();

            if (moduleError || !newModule) {
                console.error(`Error creating module ${module.title}:`, moduleError);
                throw new Error(`Failed to create module: ${module.title}`);
            }

            const moduleId = newModule.id;
            const lessons = module.lessons || [];
            console.log(`  - Inserting ${lessons.length} items for module ${moduleId}`);

            // Process Items
            if (lessons.length > 0) {
                for (const [iIndex, item] of lessons.entries()) {
                    let type = 'lesson';
                    if (item.type === 'quiz') type = 'quiz';
                    else if (item.type === 'assignment') type = 'assignment';
                    else if (item.type === 'live_class' || item.type === 'live-class') type = 'live-class';

                    // Metadata extraction
                    const metadata: any = {};

                    if (item.hasUnlockDate) {
                        metadata.hasUnlockDate = item.hasUnlockDate;
                        metadata.unlockDate = item.unlockDate;
                        metadata.unlockTime = item.unlockTime;
                    }

                    if (item.hasCloseDate !== undefined) {
                        metadata.hasCloseDate = item.hasCloseDate;
                    }
                    if (item.closeDate) {
                        metadata.closeDate = item.closeDate;
                    }
                    if (item.closeTime) {
                        metadata.closeTime = item.closeTime;
                    }

                    // Type specific handling
                    let meetingLink = item.meetingLink;

                    if (type === 'quiz') {
                        metadata.questions = item.questions || [];
                        metadata.timeLimit = item.timeLimit;
                        metadata.maxAttempts = item.maxAttempts;
                        metadata.passingGrade = item.passingGrade;
                        metadata.totalMarks = item.totalMarks;
                    } else if (type === 'assignment') {
                        metadata.content = item.content;
                        metadata.attachments = item.attachments || [];
                        metadata.timeLimit = item.timeLimit;
                        metadata.timeUnit = item.timeUnit || 'weeks';
                        metadata.totalPoints = item.totalPoints;
                        metadata.minPassPoints = item.minPassPoints;
                        metadata.fileUploadLimit = item.fileUploadLimit;
                        metadata.maxFileSize = item.maxFileSize;
                        metadata.allowResubmission = item.allowResubmission;
                        metadata.maxResubmissionAttempts = item.maxResubmissionAttempts;
                    } else if (type === 'live-class') {
                        metadata.description = item.description || item.summary || '';
                        metadata.date = item.date;
                        metadata.time = item.time;
                        metadata.platform = item.platform;

                        if (item.platform === 'google_meet' && !meetingLink) {
                            meetingLink = generateMeetLink();
                        }
                        metadata.meetingLink = meetingLink;
                    } else {
                        // Lesson
                        metadata.video = item.video;
                        metadata.videoPreview = item.videoPreview || item.video_url;
                        metadata.video_url = item.video_url || item.videoPreview;
                        metadata.coverPreview = item.coverPreview;
                        metadata.playbackHours = item.playbackHours;
                        metadata.playbackMinutes = item.playbackMinutes;
                        metadata.playbackSeconds = item.playbackSeconds;
                        metadata.playbackTime = item.playbackTime;
                        metadata.files = item.files || [];
                        metadata.links = item.links || [];
                    }

                    // Attempt to calculate duration in minutes for the DB column
                    let duration = item.duration || 0;
                    if (!duration && item.playbackTime) {
                        // Parse "HH:MM:SS"
                        const parts = item.playbackTime.split(':');
                        if (parts.length === 3) {
                            const h = parseInt(parts[0]) || 0;
                            const m = parseInt(parts[1]) || 0;
                            const s = parseInt(parts[2]) || 0;
                            duration = (h * 60) + m + Math.round(s / 60);
                        }
                    }

                    // Insert Item
                    const { error: itemError } = await supabaseAdmin
                        .from('module_items')
                        .insert({
                            module_id: moduleId,
                            type: type,
                            title: item.title || item.name || 'Untitled',
                            summary: item.summary || item.description || '',
                            content: item.content || '',
                            video_url: item.videoPreview || item.video_url || '', // Save video_url if available
                            order_index: iIndex,
                            duration: duration,
                            metadata: metadata
                        });

                    if (itemError) {
                        console.error('Error inserting module item:', itemError);
                        throw itemError;
                    }
                }
            }
        }

        // 3. Calculate and Update Course Metrics
        let lessonsCount = 0;
        let quizzesCount = 0;
        let assignmentsCount = 0;
        const topicsCount = modules.length;

        modules.forEach(module => {
            (module.lessons || []).forEach((item: any) => {
                const type = item.type;
                if (type === 'quiz') quizzesCount++;
                else if (type === 'assignment') assignmentsCount++;
                else lessonsCount++; // lesson, live_class, etc.
            });
        });

        console.log(`Updating Course Metrics: T:${topicsCount}, L:${lessonsCount}, Q:${quizzesCount}, A:${assignmentsCount}`);

        const { error: metricsError } = await supabaseAdmin
            .from('courses')
            .update({
                topics_count: topicsCount,
                lessons_count: lessonsCount,
                quizzes_count: quizzesCount,
                assignments_count: assignmentsCount
            })
            .eq('id', courseId);

        if (metricsError) {
            console.error('Error updating course metrics:', metricsError);
            // We don't throw here to avoid failing the whole save, as the curriculum is already saved
        }

        console.log('--- BUILDER SAVE SUCCESS ---');
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('SERVER ERROR saving curriculum:', error);
        // Log detailed Supabase error if available
        if (error?.code) console.error('Error Code:', error.code);
        if (error?.details) console.error('Error Details:', error.details);
        if (error?.message) console.error('Error Message:', error.message);

        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const courseId = id;

        // Fetch Modules
        const { data: modules, error: modulesError } = await supabaseAdmin
            .from('course_modules')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;

        // Fetch Items for all modules (or could be separate queries)
        // Ideally we fetch items for each module or one big query
        const enrichedModules = await Promise.all(modules.map(async (m) => {
            const { data: items, error: itemsError } = await supabaseAdmin
                .from('module_items')
                .select('*')
                .eq('module_id', m.id)
                .order('order_index', { ascending: true });

            if (itemsError) return { ...m, lessons: [] };

            // Map DB items back to Frontend structure
            const mappedItems = items?.map(item => {
                const meta = item.metadata || {};
                // Common fields
                const base = {
                    id: item.id,
                    title: item.title,
                    name: item.title, // Frontend uses name for lessons sometimes
                    type: item.type === 'live-class' ? 'live_class' : item.type, // Map back hyphen
                    summary: item.summary,
                    hasUnlockDate: meta.hasUnlockDate,
                    unlockDate: meta.unlockDate,
                    unlockTime: meta.unlockTime,
                    hasCloseDate: meta.hasCloseDate,
                    closeDate: meta.closeDate,
                    closeTime: meta.closeTime
                };

                // Specifics
                if (item.type === 'live-class') {
                    return {
                        ...base,
                        description: meta.description || item.summary,
                        date: meta.date,
                        time: meta.time,
                        duration: item.duration, // Should we store duration in DB column? Schema has duration. Use it.
                        platform: meta.platform,
                        meetingLink: meta.meetingLink
                    };
                } else if (item.type === 'quiz') {
                    return {
                        ...base,
                        questions: meta.questions || [],
                        timeLimit: meta.timeLimit,
                        maxAttempts: meta.maxAttempts,
                        passingGrade: meta.passingGrade,
                        totalMarks: meta.totalMarks
                    };
                } else if (item.type === 'assignment') {
                    return {
                        ...base,
                        content: item.content, // Main column
                        attachments: meta.attachments,
                        timeLimit: meta.timeLimit,
                        timeUnit: meta.timeUnit || 'weeks',
                        totalPoints: meta.totalPoints,
                        minPassPoints: meta.minPassPoints,
                        fileUploadLimit: meta.fileUploadLimit,
                        maxFileSize: meta.maxFileSize,
                        allowResubmission: meta.allowResubmission,
                        maxResubmissionAttempts: meta.maxResubmissionAttempts
                    };
                } else {
                    // Lesson
                    return {
                        ...base,
                        description: item.summary,
                        video: meta.video,
                        videoPreview: meta.videoPreview || item.video_url,
                        video_url: item.video_url,
                        coverPreview: meta.coverPreview,
                        files: meta.files || [],
                        links: meta.links || [],
                        playbackTime: meta.playbackTime || (item.duration ? `${item.duration} min` : ''),
                        playbackHours: meta.playbackHours || '',
                        playbackMinutes: meta.playbackMinutes || '',
                        playbackSeconds: meta.playbackSeconds || ''
                    };
                }
            });

            return {
                ...m,
                lessons: mappedItems || []
            };
        }));

        return NextResponse.json({ modules: enrichedModules });

    } catch (error) {
        console.error('Error fetching curriculum:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
