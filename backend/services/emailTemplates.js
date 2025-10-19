/**
 * EMAIL TEMPLATES - Beautiful HTML Emails with Logo
 * All templates use professional styling and responsive design
 */

const getEmailTemplate = (type, data) => {
  // ProManage+ Logo SVG (inline for email compatibility)
  const logoSVG = `
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="url(#gradient)"/>
      <path d="M20 8L28 14V26L20 32L12 26V14L20 8Z" fill="white" opacity="0.9"/>
      <circle cx="20" cy="20" r="4" fill="#06b6d4"/>
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>
    </svg>
  `;

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
      .logo-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .brand-name {
        font-size: 24px;
        font-weight: 700;
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
        color: white !important;
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
      .footer-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 12px;
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
      table {
        width: 100%;
        border-collapse: collapse;
      }
    </style>
  `;

  const footerHTML = `
    <div class="footer">
      <div class="footer-logo">
        ${logoSVG}
        <span style="color: white; font-weight: 600;">ProManage+</span>
      </div>
      <p style="margin: 0;">This is an automated email from <strong>ProManage+</strong></p>
      <p style="margin: 8px 0 0 0;">© 2025 ProManage+. All rights reserved.</p>
    </div>
  `;

  switch (type) {
    case 'taskassigned':
      return `${baseStyle}
        <div class="container">
          <div class="header">
            <div class="logo-container">
              ${logoSVG}
              <span class="brand-name">ProManage+</span>
            </div>
            <h1>✅ New Task Assigned</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.userName},</h2>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              You have been assigned a new task!
            </p>
            
            <div class="info-box">
              <h3 style="margin: 0 0 12px 0; color: #1f2937;">${data.taskTitle}</h3>
              ${data.taskDescription ? `<p style="color: #6b7280; margin: 0;">${data.taskDescription}</p>` : ''}
            </div>

            <table style="margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Priority:</strong></td>
                <td style="padding: 8px 0;">
                  <span class="priority-${data.priority}">${data.priority.toUpperCase()}</span>
                </td>
              </tr>
              ${data.deadline ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Deadline:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">
                  ${new Date(data.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Project:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${data.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Assigned by:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${data.managerName}</td>
              </tr>
            </table>

            <a href="${data.link}" class="button">View Task Details</a>
          </div>
          ${footerHTML}
        </div>
      `;

    case 'taskcompleted':
      return `${baseStyle}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <div class="logo-container">
              ${logoSVG}
              <span class="brand-name">ProManage+</span>
            </div>
            <h1>🎉 Task Completed!</h1>
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

            <table style="margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Completed by:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">${data.userName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Completed on:</strong></td>
                <td style="padding: 8px 0; color: #1f2937;">
                  ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
              </tr>
            </table>

            <a href="${data.link}" class="button" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">View Task</a>
          </div>
          ${footerHTML}
        </div>
      `;

    case 'deadlinereminder':
      return `${baseStyle}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <div class="logo-container">
              ${logoSVG}
              <span class="brand-name">ProManage+</span>
            </div>
            <h1>⏰ Deadline Reminder</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.userName},</h2>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              <strong>Reminder:</strong> The following task is due <strong>${data.daysRemaining}</strong>!
            </p>
            
            <div class="info-box" style="border-left-color: #f59e0b; background: #fef3c7;">
              <h3 style="margin: 0 0 12px 0; color: #1f2937;">${data.taskTitle}</h3>
              <p style="color: #92400e; margin: 0;">
                <strong>Deadline:</strong> ${new Date(data.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              Please ensure you complete this task on time.
            </p>

            <a href="${data.link}" class="button" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">View Task</a>
          </div>
          ${footerHTML}
        </div>
      `;

    case 'dailydigest':
      return `${baseStyle}
        <div class="container">
          <div class="header">
            <div class="logo-container">
              ${logoSVG}
              <span class="brand-name">ProManage+</span>
            </div>
            <h1>📊 Daily Summary</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">
              ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.userName},</h2>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              Here's your daily summary:
            </p>

            <table style="margin: 24px 0;">
              <tr>
                <td style="padding: 12px; background: #f3f4f6; border-radius: 8px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #06b6d4;">${data.stats.total}</div>
                  <div style="color: #6b7280; margin-top: 4px;">Total Tasks</div>
                </td>
                <td style="width: 16px;"></td>
                <td style="padding: 12px; background: #fef3c7; border-radius: 8px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${data.stats.pending}</div>
                  <div style="color: #92400e; margin-top: 4px;">Pending</div>
                </td>
              </tr>
              <tr><td style="height: 16px;"></td></tr>
              <tr>
                <td style="padding: 12px; background: #d1fae5; border-radius: 8px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #10b981;">${data.stats.completed}</div>
                  <div style="color: #065f46; margin-top: 4px;">Completed Today</div>
                </td>
                <td style="width: 16px;"></td>
                <td style="padding: 12px; background: #fee2e2; border-radius: 8px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${data.stats.overdue}</div>
                  <div style="color: #991b1b; margin-top: 4px;">Overdue</div>
                </td>
              </tr>
            </table>

            ${data.upcomingTasks.length > 0 ? `
              <h3 style="color: #1f2937; margin-top: 32px;">Upcoming Tasks:</h3>
              ${data.upcomingTasks.map(task => `
                <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin: 12px 0; border-left: 3px solid #06b6d4;">
                  <strong style="color: #1f2937;">${task.title}</strong>
                  <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                    Due: ${new Date(task.deadline).toLocaleDateString()}
                  </div>
                </div>
              `).join('')}
            ` : ''}

            <a href="${data.link}" class="button">Go to Dashboard</a>
          </div>
          ${footerHTML}
        </div>
      `;

    case 'default':
    default:
      return `${baseStyle}
        <div class="container">
          <div class="header">
            <div class="logo-container">
              ${logoSVG}
              <span class="brand-name">ProManage+</span>
            </div>
            <h1>🔔 Notification</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              ${data.message}
            </p>
            ${data.link ? `<a href="${data.link}" class="button">View Details</a>` : ''}
          </div>
          ${footerHTML}
        </div>
      `;
  }
};

module.exports = { getEmailTemplate };
