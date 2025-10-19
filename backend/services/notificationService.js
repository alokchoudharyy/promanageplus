const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { getEmailTemplate } = require('./emailTemplates');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ Email transporter
// ✅ NEW CODE - SendGrid SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY || process.env.EMAIL_PASS
  }
});


// ═══════════════════════════════════════════════════════════
// SEND NOTIFICATION TO DATABASE + OPTIONAL EMAIL
// ═══════════════════════════════════════════════════════════

/**
 * Send notification (saves to DB + sends email if enabled)
 */
async function sendNotification(userId, type, title, message, link, projectId) {
  try {
    // 1. Save to database
    const { data: notification, error: dbError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        title: title,
        message: message,
        link: link,
        project_id: projectId,
        is_read: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database notification error:', dbError);
      return { success: false, error: dbError.message };
    }

    console.log('✅ Notification saved to DB:', notification.id);

    // 2. Check if user wants email notifications
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, notification_preferences')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { success: true, notificationId: notification.id, emailSent: false };
    }

    const prefs = profile.notification_preferences || {};
    
    // Check if email notifications are enabled
    if (prefs.emailNotifications === false) {
      console.log('⚠️  Email notifications disabled for user');
      return { success: true, notificationId: notification.id, emailSent: false };
    }

    // 3. Send email notification
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const htmlContent = getEmailTemplate('default', {
          userName: profile.full_name,
          message: message,
          link: link || `${process.env.CLIENT_URL}/employee-dashboard`
        });

        await transporter.sendMail({
          from: `ProManage+ <${process.env.EMAIL_USER}>`,
          to: profile.email,
          subject: title,
          html: htmlContent
        });

        console.log('✅ Email notification sent to:', profile.email);
        return { success: true, notificationId: notification.id, emailSent: true };
      } catch (emailError) {
        console.error('⚠️  Email sending failed:', emailError);
        // Don't fail if email fails, notification is already saved
        return { success: true, notificationId: notification.id, emailSent: false };
      }
    }

    return { success: true, notificationId: notification.id, emailSent: false };
  } catch (error) {
    console.error('❌ Send notification error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════
// TASK ASSIGNED EMAIL
// ═══════════════════════════════════════════════════════════

async function sendTaskAssignedEmail(taskData, assigneeEmail, assigneeName) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email not configured');
      return { success: false, error: 'Email not configured' };
    }

    const htmlContent = getEmailTemplate('taskassigned', {
      userName: assigneeName,
      taskTitle: taskData.title,
      taskDescription: taskData.description,
      priority: taskData.priority,
      deadline: taskData.deadline,
      projectName: taskData.projectName,
      managerName: taskData.managerName,
      link: `${process.env.CLIENT_URL}/employee-tasks`
    });

    await transporter.sendMail({
      from: `ProManage+ Team <${process.env.EMAIL_USER}>`,
      to: assigneeEmail,
      subject: `New Task Assigned: ${taskData.title}`,
      html: htmlContent
    });

    console.log('✅ Task assigned email sent to:', assigneeEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending task assigned email:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════
// TASK COMPLETED EMAIL
// ═══════════════════════════════════════════════════════════

async function sendTaskCompletedEmail(taskData, managerEmail, managerName, userName) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { success: false, error: 'Email not configured' };
    }

    const htmlContent = getEmailTemplate('taskcompleted', {
      managerName,
      userName,
      taskTitle: taskData.title,
      projectName: taskData.projectName,
      link: `${process.env.CLIENT_URL}/projects/${taskData.projectId}/tasks`
    });

    await transporter.sendMail({
      from: `ProManage+ Team <${process.env.EMAIL_USER}>`,
      to: managerEmail,
      subject: `Task Completed: ${taskData.title}`,
      html: htmlContent
    });

    console.log('✅ Task completed email sent to:', managerEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending task completed email:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════
// DEADLINE REMINDER EMAIL
// ═══════════════════════════════════════════════════════════

async function sendDeadlineReminderEmail(taskData, userEmail, userName) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { success: false, error: 'Email not configured' };
    }

    const deadline = new Date(taskData.deadline);
    const now = new Date();
    const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    let daysText;
    if (daysRemaining < 0) {
      daysText = 'overdue';
    } else if (daysRemaining === 0) {
      daysText = 'today';
    } else if (daysRemaining === 1) {
      daysText = 'tomorrow';
    } else {
      daysText = `in ${daysRemaining} days`;
    }

    const htmlContent = getEmailTemplate('deadlinereminder', {
      userName,
      taskTitle: taskData.title,
      deadline: taskData.deadline,
      daysRemaining: daysText,
      link: `${process.env.CLIENT_URL}/employee-tasks`
    });

    await transporter.sendMail({
      from: `ProManage+ Team <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `⏰ Deadline Reminder: ${taskData.title}`,
      html: htmlContent
    });

    console.log('✅ Deadline reminder sent to:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending deadline reminder:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════
// DAILY DIGEST EMAIL
// ═══════════════════════════════════════════════════════════

async function sendDailyDigestEmail(userId, userEmail, userName) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { success: false, error: 'Email not configured' };
    }

    // Fetch user's tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId);

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));

    const stats = {
      total: tasks?.length || 0,
      pending: tasks?.filter(t => t.status !== 'done').length || 0,
      completed: tasks?.filter(t => {
        const updatedDate = new Date(t.updated_at);
        return t.status === 'done' && updatedDate >= today;
      }).length || 0,
      overdue: tasks?.filter(t => {
        return t.status !== 'done' && t.deadline && new Date(t.deadline) < now;
      }).length || 0
    };

    const upcomingTasks = tasks
      ?.filter(t => t.status !== 'done' && t.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 3) || [];

    const htmlContent = getEmailTemplate('dailydigest', {
      userName,
      stats,
      upcomingTasks,
      link: `${process.env.CLIENT_URL}/employee-dashboard`,
      unsubscribeLink: `${process.env.CLIENT_URL}/settings`
    });

    await transporter.sendMail({
      from: `ProManage+ Team <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `📊 Your Daily Summary - ${new Date().toLocaleDateString()}`,
      html: htmlContent
    });

    console.log('✅ Daily digest sent to:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending daily digest:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotification,
  sendTaskAssignedEmail,
  sendTaskCompletedEmail,
  sendDeadlineReminderEmail,
  sendDailyDigestEmail
};
