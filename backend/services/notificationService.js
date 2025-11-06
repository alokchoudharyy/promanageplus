const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { getEmailTemplate } = require('./emailTemplates');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ═══════════════════════════════════════════════════════════
// NOTIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Send task assigned email
 */
async function sendTaskAssignedEmail(taskData, assigneeEmail, assigneeName) {
  try {
    const htmlContent = getEmailTemplate('task_assigned', {
      userName: assigneeName,
      taskTitle: taskData.title,
      taskDescription: taskData.description,
      priority: taskData.priority,
      deadline: taskData.deadline,
      projectName: taskData.projectName,
      managerName: taskData.managerName,
      link: `${process.env.CLIENT_URL}/employee/tasks`,
    });

    await transporter.sendMail({
      from: `"ProManage+ Team" <${process.env.EMAIL_USER}>`,
      to: assigneeEmail,
      subject: `📋 New Task Assigned: ${taskData.title}`,
      html: htmlContent,
    });

    console.log(`✅ Task assigned email sent to ${assigneeEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending task assigned email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send task completed email
 */
async function sendTaskCompletedEmail(taskData, managerEmail, managerName, userName) {
  try {
    const htmlContent = getEmailTemplate('task_completed', {
      managerName,
      userName,
      taskTitle: taskData.title,
      projectName: taskData.projectName,
      link: `${process.env.CLIENT_URL}/projects/${taskData.projectId}/tasks`,
    });

    await transporter.sendMail({
      from: `"ProManage+ Team" <${process.env.EMAIL_USER}>`,
      to: managerEmail,
      subject: `✅ Task Completed: ${taskData.title}`,
      html: htmlContent,
    });

    console.log(`✅ Task completed email sent to ${managerEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending task completed email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send deadline reminder email
 */
async function sendDeadlineReminderEmail(taskData, userEmail, userName) {
  try {
    const deadline = new Date(taskData.deadline);
    const now = new Date();
    const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    let daysText = '';
    if (daysRemaining === 0) daysText = 'today';
    else if (daysRemaining === 1) daysText = 'tomorrow';
    else daysText = `in ${daysRemaining} days`;

    const htmlContent = getEmailTemplate('deadline_reminder', {
      userName,
      taskTitle: taskData.title,
      deadline: taskData.deadline,
      daysRemaining: daysText,
      link: `${process.env.CLIENT_URL}/employee/tasks`,
    });

    await transporter.sendMail({
      from: `"ProManage+ Team" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `⏰ Deadline Reminder: ${taskData.title}`,
      html: htmlContent,
    });

    console.log(`✅ Deadline reminder sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending deadline reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send daily digest email
 */
async function sendDailyDigestEmail(userId, userEmail, userName) {
  try {
    // Fetch user's tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee_id', userId);

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
      }).length || 0,
    };

    const upcomingTasks = tasks
      ?.filter(t => t.status !== 'done' && t.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 3) || [];

    const htmlContent = getEmailTemplate('daily_digest', {
      userName,
      stats,
      upcomingTasks,
      link: `${process.env.CLIENT_URL}/employee-dashboard`,
      unsubscribeLink: `${process.env.CLIENT_URL}/settings`,
    });

    await transporter.sendMail({
      from: `"ProManage+ Team" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `📊 Your Daily Summary - ${new Date().toLocaleDateString()}`,
      html: htmlContent,
    });

    console.log(`✅ Daily digest sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending daily digest:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendTaskAssignedEmail,
  sendTaskCompletedEmail,
  sendDeadlineReminderEmail,
  sendDailyDigestEmail,
};
