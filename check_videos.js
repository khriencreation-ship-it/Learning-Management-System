const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideos() {
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title');

  if (coursesError) {
    console.error('Error fetching courses:', coursesError);
    return;
  }

  for (const course of courses) {
    console.log(`Checking Course: ${course.title} (${course.id})`);
    
    const { data: items, error: itemsError } = await supabase
      .from('module_items')
      .select('id, title, video_url, metadata')
      .eq('type', 'lesson');

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      continue;
    }

    for (const item of items) {
        if (item.video_url || item.metadata?.video_url || item.metadata?.videoPreview) {
            console.log(`  - Lesson: ${item.title}`);
            console.log(`    video_url: ${item.video_url}`);
            console.log(`    meta.video_url: ${item.metadata?.video_url}`);
            console.log(`    meta.videoPreview: ${item.metadata?.videoPreview}`);
        }
    }
  }
}

checkVideos();
