import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

/**
 * Export Service for generating Excel, PDF, and CSV reports
 */

// ═══════════════════════════════════════════════════════════
// 1. EXCEL EXPORT
// ═══════════════════════════════════════════════════════════

export const exportToExcel = (data, filename = 'report', sheetName = 'Report') => {
  try {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const maxWidth = data.reduce((w, r) => Math.max(w, ...Object.keys(r).map(k => k.length)), 10);
    ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    saveAs(blob, `${filename}.xlsx`);
    return { success: true, message: 'Excel file downloaded successfully' };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, message: 'Failed to export Excel file' };
  }
};

// ═══════════════════════════════════════════════════════════
// 2. PDF EXPORT
// ═══════════════════════════════════════════════════════════

export const exportToPDF = (data, filename = 'report', title = 'Report', options = {}) => {
  try {
    const doc = new jsPDF(options.orientation || 'portrait');

    // Add title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, 20);

    // Add metadata
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Records: ${data.length}`, 14, 34);

    // Convert data to table format
    const headers = Object.keys(data[0] || {});
    const rows = data.map(item => headers.map(header => item[header] || '-'));

    // Add table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [14, 165, 233], // Cyan color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { top: 40, left: 14, right: 14 },
    });

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`${filename}.pdf`);
    return { success: true, message: 'PDF file downloaded successfully' };
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, message: 'Failed to export PDF file' };
  }
};

// ═══════════════════════════════════════════════════════════
// 3. CSV EXPORT
// ═══════════════════════════════════════════════════════════

export const exportToCSV = (data, filename = 'report') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent += values.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
    return { success: true, message: 'CSV file downloaded successfully' };
  } catch (error) {
    console.error('CSV export error:', error);
    return { success: false, message: 'Failed to export CSV file' };
  }
};

// ═══════════════════════════════════════════════════════════
// 4. SPECIALIZED EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Export Task Report
 */
export const exportTaskReport = (tasks, format = 'excel') => {
  const formattedData = tasks.map(task => ({
    'Task ID': task.id.substring(0, 8),
    'Title': task.title,
    'Description': task.description || 'N/A',
    'Status': task.status,
    'Priority': task.priority,
    'Assigned To': task.assignee?.full_name || 'Unassigned',
    'Project': task.project?.name || 'N/A',
    'Deadline': task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline',
    'Created At': new Date(task.created_at).toLocaleDateString(),
  }));

  const filename = `tasks_report_${new Date().toISOString().split('T')[0]}`;
  
  switch (format) {
    case 'excel':
      return exportToExcel(formattedData, filename, 'Tasks');
    case 'pdf':
      return exportToPDF(formattedData, filename, 'Tasks Report');
    case 'csv':
      return exportToCSV(formattedData, filename);
    default:
      return { success: false, message: 'Invalid format' };
  }
};

/**
 * Export Project Report
 */
export const exportProjectReport = (projects, format = 'excel') => {
  const formattedData = projects.map(project => ({
    'Project ID': project.id.substring(0, 8),
    'Name': project.name,
    'Description': project.description || 'N/A',
    'Status': project.status,
    'Tasks': project.totalTasks || 0,
    'Completed': project.completedTasks || 0,
    'Progress': project.totalTasks > 0 
      ? `${Math.round((project.completedTasks / project.totalTasks) * 100)}%` 
      : '0%',
    'Created At': new Date(project.created_at).toLocaleDateString(),
  }));

  const filename = `projects_report_${new Date().toISOString().split('T')[0]}`;
  
  switch (format) {
    case 'excel':
      return exportToExcel(formattedData, filename, 'Projects');
    case 'pdf':
      return exportToPDF(formattedData, filename, 'Projects Report');
    case 'csv':
      return exportToCSV(formattedData, filename);
    default:
      return { success: false, message: 'Invalid format' };
  }
};

/**
 * Export Team Performance Report
 */
export const exportTeamPerformanceReport = (teamMembers, format = 'excel') => {
  const formattedData = teamMembers.map(member => ({
    'Employee ID': member.id.substring(0, 8),
    'Name': member.full_name || 'Unknown',
    'Email': member.email,
    'Total Tasks': member.totalTasks || 0,
    'Completed': member.completedTasks || 0,
    'Active': member.activeTasks || 0,
    'Completion Rate': member.totalTasks > 0 
      ? `${Math.round((member.completedTasks / member.totalTasks) * 100)}%` 
      : '0%',
    'Joined': new Date(member.created_at).toLocaleDateString(),
  }));

  const filename = `team_performance_${new Date().toISOString().split('T')[0]}`;
  
  switch (format) {
    case 'excel':
      return exportToExcel(formattedData, filename, 'Team Performance');
    case 'pdf':
      return exportToPDF(formattedData, filename, 'Team Performance Report', { orientation: 'landscape' });
    case 'csv':
      return exportToCSV(formattedData, filename);
    default:
      return { success: false, message: 'Invalid format' };
  }
};

/**
 * Export Activity Log Report
 */
export const exportActivityLogReport = (activities, format = 'excel') => {
  const formattedData = activities.map(activity => ({
    'User': activity.user?.full_name || 'Unknown',
    'Action': activity.action_type,
    'Description': activity.description,
    'Entity Type': activity.entity_type || 'N/A',
    'Date': new Date(activity.created_at).toLocaleString(),
  }));

  const filename = `activity_log_${new Date().toISOString().split('T')[0]}`;
  
  switch (format) {
    case 'excel':
      return exportToExcel(formattedData, filename, 'Activity Log');
    case 'pdf':
      return exportToPDF(formattedData, filename, 'Activity Log Report', { orientation: 'landscape' });
    case 'csv':
      return exportToCSV(formattedData, filename);
    default:
      return { success: false, message: 'Invalid format' };
  }
};

/**
 * Export Multi-Sheet Excel (All Reports Combined)
 */
export const exportCompleteReport = (data) => {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Overview
    const overview = [{
      'Report Type': 'Complete Project Report',
      'Generated On': new Date().toLocaleString(),
      'Total Projects': data.projects?.length || 0,
      'Total Tasks': data.tasks?.length || 0,
      'Team Members': data.teamMembers?.length || 0,
    }];
    const wsOverview = XLSX.utils.json_to_sheet(overview);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

    // Sheet 2: Projects
    if (data.projects) {
      const projectsData = data.projects.map(p => ({
        'Name': p.name,
        'Status': p.status,
        'Tasks': p.totalTasks || 0,
        'Completed': p.completedTasks || 0,
        'Created': new Date(p.created_at).toLocaleDateString(),
      }));
      const wsProjects = XLSX.utils.json_to_sheet(projectsData);
      XLSX.utils.book_append_sheet(wb, wsProjects, 'Projects');
    }

    // Sheet 3: Tasks
    if (data.tasks) {
      const tasksData = data.tasks.map(t => ({
        'Title': t.title,
        'Status': t.status,
        'Priority': t.priority,
        'Assignee': t.assignee?.full_name || 'Unassigned',
        'Deadline': t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline',
      }));
      const wsTasks = XLSX.utils.json_to_sheet(tasksData);
      XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');
    }

    // Sheet 4: Team Performance
    if (data.teamMembers) {
      const teamData = data.teamMembers.map(m => ({
        'Name': m.full_name,
        'Email': m.email,
        'Total Tasks': m.totalTasks || 0,
        'Completed': m.completedTasks || 0,
        'Active': m.activeTasks || 0,
      }));
      const wsTeam = XLSX.utils.json_to_sheet(teamData);
      XLSX.utils.book_append_sheet(wb, wsTeam, 'Team Performance');
    }

    // Generate and download
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const filename = `complete_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, filename);
    
    return { success: true, message: 'Complete report downloaded successfully' };
  } catch (error) {
    console.error('Complete report export error:', error);
    return { success: false, message: 'Failed to export complete report' };
  }
};
