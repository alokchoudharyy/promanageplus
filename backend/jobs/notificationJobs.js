const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const notificationService = require('../services/notificationService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ═══════════════════════════════════════════════════════════
// AUTOMATED NOTIFICATION JOBS
// ═══════════════════════════════════════════════════════════

/**
 * Send deadline reminders for tasks due tomorrow
 * Runs every day at 9 AM
 */
const deadlineReminderJob = cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running deadline reminder job...');
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Fetch tasks due tomorrow
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:assignee_id  (full_name, email, notification_preferences)
      `)
      .eq('status', 'in-progress')
      .gte('deadline', tomorrow.toISOString())
      .lt('deadline', dayAfter.toISOString());

    if (error) throw error;

    console.log(`Found ${tasks?.length || 0} tasks due tomorrow`);

    let sentCount = 0;
    for (const task of tasks || []) {
      if (task.assignee?.email) {
        const prefs = task.assignee.notification_preferences || {};
        if (prefs.deadlineReminders !== false) {
          await notificationService.sendDeadlineReminderEmail(
            {
              title: task.title,
              deadline: task.deadline,
            },
            task.assignee.email,
            task.assignee.full_name
          );
          sentCount++;
        }
      }
    }

    console.log(`✅ Sent ${sentCount} deadline reminders`);
  } catch (error) {
    console.error('❌ Error in deadline reminder job:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Kolkata'
});

/**
 * Send daily digest emails
 * Runs every day at 8 AM
 */
const dailyDigestJob = cron.schedule('0 8 * * *', async () => {
  console.log('📊 Running daily digest job...');
  
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, notification_preferences')
      .neq('email', null);

    if (error) throw error;

    console.log(`Found ${users?.length || 0} users`);

    let sentCount = 0;
    for (const user of users || []) {
      const prefs = user.notification_preferences || {};
      if (prefs.dailyDigest !== false) {
        await notificationService.sendDailyDigestEmail(
          user.id,
          user.email,
          user.full_name
        );
        sentCount++;
      }
    }

    console.log(`✅ Sent ${sentCount} daily digests`);
  } catch (error) {
    console.error('❌ Error in daily digest job:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Kolkata'
});

/**
 * Start all cron jobs
 */
function startNotificationJobs() {
  console.log('🚀 Starting notification cron jobs...');
  
  deadlineReminderJob.start();
  dailyDigestJob.start();
  
  console.log('✅ All notification jobs started');
  console.log('📅 Deadline reminders: Daily at 9 AM IST');
  console.log('📊 Daily digests: Daily at 8 AM IST');
}

/**
 * Stop all cron jobs
 */
function stopNotificationJobs() {
  deadlineReminderJob.stop();
  dailyDigestJob.stop();
  console.log('🛑 All notification jobs stopped');
}

module.exports = {
  startNotificationJobs,
  stopNotificationJobs,
  deadlineReminderJob,
  dailyDigestJob,
};
