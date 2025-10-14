const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get full AI analysis for a task
 */
export const analyzeTask = async (title, description) => {
  try {
    const response = await fetch(`${API_URL}/ai/analyze-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    return await response.json();
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      success: false,
      data: {
        priority: 'medium',
        estimatedDays: 7,
        complexity: 'moderate',
        suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reasoning: 'Service unavailable',
        suggestions: []
      }
    };
  }
};

/**
 * Get AI priority suggestion
 */
export const suggestPriority = async (title, description) => {
  try {
    const response = await fetch(`${API_URL}/ai/suggest-priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    return await response.json();
  } catch (error) {
    console.error('Priority Suggestion Error:', error);
    return { success: false, priority: 'medium' };
  }
};

/**
 * Get AI deadline suggestion
 */
export const suggestDeadline = async (title, description) => {
  try {
    const response = await fetch(`${API_URL}/ai/suggest-deadline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    return await response.json();
  } catch (error) {
    console.error('Deadline Suggestion Error:', error);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    return { 
      success: false, 
      estimatedDays: 7,
      suggestedDeadline: deadline.toISOString().split('T')[0]
    };
  }
};

/**
 * Get task completion tips
 */
export const getTaskTips = async (title, description) => {
  try {
    const response = await fetch(`${API_URL}/ai/get-tips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    return await response.json();
  } catch (error) {
    console.error('Tips Error:', error);
    return { 
      success: false, 
      tips: ['Break into steps', 'Set milestones', 'Track progress'] 
    };
  }
};
