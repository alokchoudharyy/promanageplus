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
 * Runs every day at 9 AM IST
 */
const deadlineReminderJob = cron.schedule('0 9 * * *', async () => {
  console.log('⏰ [CRON] Running deadline reminder job...');
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Fetch tasks due tomorrow (not completed)
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:assigned_to (
          id,
          full_name, 
          email, 
          notification_preferences
        )
      `)
      .in('status', ['pending', 'in_progress']) // Both pending and in-progress
      .gte('deadline', tomorrow.toISOString())
      .lt('deadline', dayAfter.toISOString());

    if (error) {
      console.error('❌ [CRON] Error fetching tasks:', error);
      throw error;
    }

    console.log(`📋 [CRON] Found ${tasks?.length || 0} tasks due tomorrow`);

    if (!tasks || tasks.length === 0) {
      console.log('✅ [CRON] No deadline reminders to send');
      return;
    }

    let sentCount = 0;
    let errorCount = 0;

    for (const task of tasks) {
      if (!task.assignee?.email) {
        console.warn(`⚠️ [CRON] Task "${task.title}" has no assignee email`);
        continue;
      }

      const prefs = task.assignee.notification_preferences || {};
      
      // Check if user has deadline reminders enabled
      if (prefs.deadlineReminders === false) {
        console.log(`⏭️ [CRON] Skipping ${task.assignee.email} - reminders disabled`);
        continue;
      }

      try {
        await notificationService.sendDeadlineReminderEmail(
          {
            title: task.title,
            deadline: task.deadline,
          },
          task.assignee.email,
          task.assignee.full_name
        );
        sentCount++;
        console.log(`✅ [CRON] Reminder sent to ${task.assignee.email}`);
      } catch (emailError) {
        errorCount++;
        console.error(`❌ [CRON] Failed to send reminder to ${task.assignee.email}:`, emailError.message);
      }
    }

    console.log(`✅ [CRON] Deadline reminder job complete: ${sentCount} sent, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ [CRON] Deadline reminder job failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Kolkata'
});

/**
 * Send daily digest emails
 * Runs every day at 8 AM IST
 */
const dailyDigestJob = cron.schedule('0 8 * * *', async () => {
  console.log('📊 [CRON] Running daily digest job...');
  
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, notification_preferences, role')
      .neq('email', null);

    if (error) {
      console.error('❌ [CRON] Error fetching users:', error);
      throw error;
    }

    console.log(`👥 [CRON] Found ${users?.length || 0} users with emails`);

    if (!users || users.length === 0) {
      console.log('✅ [CRON] No daily digests to send');
      return;
    }

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const prefs = user.notification_preferences || {};
      
      // Check if user has daily digest enabled
      if (prefs.dailyDigest === false) {
        skippedCount++;
        console.log(`⏭️ [CRON] Skipping ${user.email} - digest disabled`);
        continue;
      }

      try {
        const result = await notificationService.sendDailyDigestEmail(
          user.id,
          user.email,
          user.full_name
        );

        if (result.success) {
          sentCount++;
          console.log(`✅ [CRON] Digest sent to ${user.email}`);
        } else {
          errorCount++;
          console.warn(`⚠️ [CRON] Digest failed for ${user.email}:`, result.error);
        }
      } catch (emailError) {
        errorCount++;
        console.error(`❌ [CRON] Failed to send digest to ${user.email}:`, emailError.message);
      }
    }

    console.log(`✅ [CRON] Daily digest job complete: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ [CRON] Daily digest job failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Kolkata'
});

/**
 * Send overdue task reminders
 * Runs every day at 10 AM IST
 */
const overdueTaskReminderJob = cron.schedule('0 10 * * *', async () => {
  console.log('⚠️ [CRON] Running overdue task reminder job...');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch overdue tasks (deadline passed, not completed)
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:assigned_to (
          id,
          full_name, 
          email, 
          notification_preferences
        )
      `)
      .in('status', ['pending', 'in_progress'])
      .lt('deadline', today.toISOString());

    if (error) {
      console.error('❌ [CRON] Error fetching overdue tasks:', error);
      throw error;
    }

    console.log(`📋 [CRON] Found ${tasks?.length || 0} overdue tasks`);

    if (!tasks || tasks.length === 0) {
      console.log('✅ [CRON] No overdue task reminders to send');
      return;
    }

    let sentCount = 0;
    let errorCount = 0;

    for (const task of tasks) {
      if (!task.assignee?.email) continue;

      const prefs = task.assignee.notification_preferences || {};
      if (prefs.deadlineReminders === false) continue;

      try {
        await notificationService.sendDeadlineReminderEmail(
          {
            title: task.title,
            deadline: task.deadline,
          },
          task.assignee.email,
          task.assignee.full_name
        );
        sentCount++;
      } catch (emailError) {
        errorCount++;
        console.error(`❌ [CRON] Failed to send overdue reminder:`, emailError.message);
      }
    }

    console.log(`✅ [CRON] Overdue reminder job complete: ${sentCount} sent, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ [CRON] Overdue reminder job failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Kolkata'
});

/**
 * Start all cron jobs
 */
function startNotificationJobs() {
  console.log('\n🚀 ═══════════════════════════════════════════════════════════');
  console.log('   Starting Notification Cron Jobs');
  console.log('═══════════════════════════════════════════════════════════');
  
  deadlineReminderJob.start();
  dailyDigestJob.start();
  overdueTaskReminderJob.start();
  
  console.log('✅ All notification cron jobs started');
  console.log('📅 Schedule:');
  console.log('   • Deadline reminders: Daily at 9:00 AM IST');
  console.log('   • Daily digests:       Daily at 8:00 AM IST');
  console.log('   • Overdue reminders:   Daily at 10:00 AM IST');
  console.log('🌍 Timezone: Asia/Kolkata (IST)');
  console.log('═══════════════════════════════════════════════════════════\n');
}

/**
 * Stop all cron jobs
 */
function stopNotificationJobs() {
  console.log('🛑 Stopping all notification cron jobs...');
  deadlineReminderJob.stop();
  dailyDigestJob.stop();
  overdueTaskReminderJob.stop();
  console.log('✅ All notification jobs stopped');
}

/**
 * Run a specific job immediately (for testing)
 */
async function runJobNow(jobName) {
  console.log(`🔧 [TEST] Running ${jobName} job manually...`);
  
  switch (jobName) {
    case 'deadline':
      await deadlineReminderJob.now();
      break;
    case 'digest':
      await dailyDigestJob.now();
      break;
    case 'overdue':
      await overdueTaskReminderJob.now();
      break;
    default:
      console.error(`❌ Unknown job: ${jobName}`);
  }
}

module.exports = {
  startNotificationJobs,
  stopNotificationJobs,
  runJobNow,
  deadlineReminderJob,
  dailyDigestJob,
  overdueTaskReminderJob,
};
