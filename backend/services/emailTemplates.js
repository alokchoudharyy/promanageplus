// ═══════════════════════════════════════════════════════════
// EMAIL TEMPLATES - Beautiful HTML emails
// ═══════════════════════════════════════════════════════════

const getEmailTemplate = (type, data) => {
  const baseStyle = `
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        background: #f3f4f6; 
        margin: 0; 
        padding: 0; 
      }
      .container { 
        max-width: 600px; 
        margin: 20px auto; 
        background: white; 
        border-radius: 12px; 
        overflow: hidden; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
      }
      .header { 
        background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); 
        padding: 30px; 
        text-align: center; 
        color: white; 
      }
      .header h1 { 
        margin: 0; 
        font-size: 28px; 
        font-weight: 700; 
      }
      .content { 
        padding: 40px 30px; 
      }
      .button { 
        display: inline-block; 
        background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); 
        color: white; 
        padding: 14px 28px; 
        text-decoration: none; 
        border-radius: 8px; 
        font-weight: 600; 
        margin: 20px 0; 
      }
      .info-box { 
        background: #f3f4f6; 
        border-left: 4px solid #06b6d4; 
        padding: 16px; 
        margin: 20px 0; 
        border-radius: 6px; 
      }
      .footer { 
        background: #1f2937; 
        color: #9ca3af; 
        padding: 20px; 
        text-align: center; 
        font-size: 13px; 
      }
      .priority-high { 
        color: #ef4444; 
        font-weight: bold; 
      }
      .priority-medium { 
        color: #f59e0b; 
        font-weight: bold; 
      }
      .priority-low { 
        color: #6b7280; 
        font-weight: bold; 
      }
    </style>
  `;

  switch (type) {
    case 'task_assigned':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>📋 New Task Assigned</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.userName},</h2>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              You have been assigned a new task:
            </p>
            
            <div class="info-box">
              <h3 style="margin: 0 0 12px 0; color: #1f2937;">${data.taskTitle}</h3>
              ${data.taskDescription ? `<p style="color: #6b7280; margin: 0;">${data.taskDescription}</p>` : ''}
            </div>

            <table style="width: 100%; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">
                  <strong>Priority:</strong>
                </td>
                <td style="padding: 8px 0;">
                  <span class="priority-${data.priority}">${data.priority.toUpperCase()}</span>
                </td>
              </tr>
              ${data.deadline ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">
                  <strong>Deadline:</strong>
                </td>
                <td style="padding: 8px 0; color: #1f2937;">
                  ${new Date(data.deadline).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">
                  <strong>Project:</strong>
                </td>
                <td style="padding: 8px 0; color: #1f2937;">
                  ${data.projectName}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">
                  <strong>Assigned by:</strong>
                </td>
                <td style="padding: 8px 0; color: #1f2937;">
                  ${data.managerName}
                </td>
              </tr>
            </table>

            <a href="${data.link}" class="button">View Task Details</a>
          </div>
          <div class="footer">
            <p style="margin: 0;">This is an automated email from <strong>ProManage+</strong></p>
            <p style="margin: 8px 0 0 0;">© 2025 ProManage+. All rights reserved.</p>
          </div>
        </div>
      `;

    case 'task_updated':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>🔄 Task Updated</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.userName},</h2>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              A task assigned to you has been updated:
            </p>
            
            <div class="info-box">
              <h3 style="margin: 0 0 12px 0; color: #1f2937;">${data.taskTitle}</h3>
              <p style="color: #6b7280; margin: 0;"><strong>Changes:</strong> ${data.changes}</p>
            </div>

            <a href="${data.link}" class="button">View Updated Task</a>
          </div>
          <div class="footer">
            <p style="margin: 0;">ProManage+ Notification System</p>
          </div>
        </div>
      `;

    case 'task_completed':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <h1>✅ Task Completed!</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Great news, ${data.managerName}!</h2>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              <strong>${data.userName}</strong> has completed the following task:
            </p>
            
            <div class="info-box" style="border-left-color: #10b981;">
              <h3 style="margin: 0 0 12px 0; color: #1f2937;">${data.taskTitle}</h3>
              <p style="color: #6b7280; margin: 0;">Project: ${data.projectName}</p>
            </div>

            <table style="width: 100%; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">
                  <strong>Completed by:</strong>
                </td>
                <td style="padding: 8px 0; color: #1f2937;">
                  ${data.userName}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">
                  <strong>Completed on:</strong>
                </td>
                <td style="padding: 8px 0; color: #1f2937;">
                  ${new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </td>
              </tr>
            </table>

            <a href="${data.link}" class="button">View Task</a>
          </div>
          <div class="footer">
            <p style="margin: 0;">ProManage+ Notification System</p>
          </div>
        </div>
      `;

    case 'deadline_reminder':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <h1>⏰ Deadline Reminder</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.userName},</h2>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              ⚠️ <strong>Reminder:</strong> The following task is due ${data.daysRemaining}:
            </p>
            
            <div class="info-box" style="border-left-color: #f59e0b; background: #fef3c7;">
              <h3 style="margin: 0 0 12px 0; color: #1f2937;">${data.taskTitle}</h3>
              <p style="color: #92400e; margin: 0;">
                <strong>Deadline:</strong> ${new Date(data.deadline).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              Please ensure you complete this task on time.
            </p>

            <a href="${data.link}" class="button">View Task</a>
          </div>
          <div class="footer">
            <p style="margin: 0;">ProManage+ Notification System</p>
          </div>
        </div>
      `;

    case 'daily_digest':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>📊 Daily Summary</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.userName},</h2>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              Here's your daily summary:
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #06b6d4;">${data.stats.total}</div>
                <div style="color: #6b7280; margin-top: 4px;">Total Tasks</div>
              </div>
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${data.stats.pending}</div>
                <div style="color: #92400e; margin-top: 4px;">Pending</div>
              </div>
              <div style="background: #d1fae5; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #10b981;">${data.stats.completed}</div>
                <div style="color: #065f46; margin-top: 4px;">Completed Today</div>
              </div>
              <div style="background: #fee2e2; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${data.stats.overdue}</div>
                <div style="color: #991b1b; margin-top: 4px;">Overdue</div>
              </div>
            </div>

            ${data.upcomingTasks.length > 0 ? `
            <h3 style="color: #1f2937; margin-top: 32px;">📅 Upcoming Tasks</h3>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 12px 0;">
              ${data.upcomingTasks.map(task => `
                <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #1f2937;">${task.title}</strong>
                  <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                    Due: ${new Date(task.deadline).toLocaleDateString()}
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <a href="${data.link}" class="button">Go to Dashboard</a>
          </div>
          <div class="footer">
            <p style="margin: 0;">ProManage+ Daily Digest</p>
            <p style="margin: 8px 0 0 0;">
              <a href="${data.unsubscribeLink}" style="color: #9ca3af;">Unsubscribe from daily digest</a>
            </p>
          </div>
        </div>
      `;

    default:
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>🔔 Notification</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #4b5563;">${data.message}</p>
            <a href="${data.link}" class="button">View Details</a>
          </div>
          <div class="footer">
            <p style="margin: 0;">ProManage+ Notification System</p>
          </div>
        </div>
      `;
  }
};

module.exports = { getEmailTemplate };
