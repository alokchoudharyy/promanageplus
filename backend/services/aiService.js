// ═══════════════════════════════════════════════════════════
// AI SERVICE - GROQ API (Free & Fast Alternative to Gemini)
// ═══════════════════════════════════════════════════════════

const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Call Groq API with error handling
 */
async function callGroqAPI(prompt, jsonMode = false) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a project management AI assistant. Provide accurate, structured analysis for task management. Always respond in valid JSON format when requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile", // Free and fast
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
      response_format: jsonMode ? { type: "json_object" } : { type: "text" }
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error('❌ Groq API Error:', error.message);
    throw error;
  }
}

/**
 * Analyze task and get AI suggestions
 */
async function analyzeTask(taskTitle, taskDescription) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const prompt = `Analyze this project management task and provide structured predictions in JSON format:

Task Title: ${taskTitle}
Task Description: ${taskDescription || 'No description provided'}

Provide analysis in this exact JSON format:
{
  "priority": "medium",
  "estimatedDays": 7,
  "complexity": "moderate",
  "suggestedDeadline": "2025-11-11",
  "reasoning": "Brief explanation in 1-2 sentences",
  "suggestions": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"]
}

Rules:
- priority: must be "high", "medium", or "low"
- estimatedDays: number between 1 and 30
- complexity: must be "simple", "moderate", or "complex"
- suggestedDeadline: format as YYYY-MM-DD (${today} or later)
- reasoning: 1-2 sentences explaining the analysis
- suggestions: exactly 3 actionable tips (each under 100 characters)

Return ONLY valid JSON.`;

    const response = await callGroqAPI(prompt, true);
    let analysis = JSON.parse(response);

    // Validate and sanitize priority
    if (!['high', 'medium', 'low'].includes(analysis.priority)) {
      analysis.priority = 'medium';
    }

    // Validate and sanitize complexity
    if (!['simple', 'moderate', 'complex'].includes(analysis.complexity)) {
      analysis.complexity = 'moderate';
    }

    // Validate and sanitize estimated days
    if (!analysis.estimatedDays || analysis.estimatedDays < 1 || analysis.estimatedDays > 30) {
      analysis.estimatedDays = 7;
    }

    // Validate and fix deadline
    if (!analysis.suggestedDeadline || !analysis.suggestedDeadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + (analysis.estimatedDays || 7));
      analysis.suggestedDeadline = deadline.toISOString().split('T')[0];
    }

    // Validate suggestions
    if (!Array.isArray(analysis.suggestions) || analysis.suggestions.length === 0) {
      analysis.suggestions = [
        'Break down the task into smaller steps',
        'Set clear milestones and checkpoints',
        'Review progress regularly'
      ];
    }

    // Validate reasoning
    if (!analysis.reasoning || analysis.reasoning.length < 10) {
      analysis.reasoning = 'Task analyzed based on title and description provided.';
    }

    console.log('✅ AI Analysis successful:', analysis);

    return {
      success: true,
      data: analysis
    };

  } catch (error) {
    console.error('❌ AI Analysis Error:', error.message);

    // Fallback response
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    return {
      success: false,
      error: error.message,
      data: {
        priority: 'medium',
        estimatedDays: 7,
        complexity: 'moderate',
        suggestedDeadline: deadline.toISOString().split('T')[0],
        reasoning: 'AI service unavailable. Using default values.',
        suggestions: [
          'Break down the task into smaller steps',
          'Set clear milestones and checkpoints',
          'Review progress regularly'
        ]
      }
    };
  }
}

/**
 * Get priority suggestion only
 */
async function suggestPriority(taskTitle, taskDescription) {
  try {
    const prompt = `Task: ${taskTitle}
Description: ${taskDescription || 'No description'}

Based on this task, what priority should it have? Respond with ONLY one word: "high", "medium", or "low"`;

    const response = await callGroqAPI(prompt, false);
    const priority = response.trim().toLowerCase();

    const validPriorities = ['high', 'medium', 'low'];
    if (validPriorities.includes(priority)) {
      return { success: true, priority };
    } else {
      return { success: true, priority: 'medium' };
    }

  } catch (error) {
    console.error('❌ Priority Suggestion Error:', error.message);
    return { success: false, priority: 'medium' };
  }
}

/**
 * Get deadline suggestion only
 */
async function suggestDeadline(taskTitle, taskDescription) {
  try {
    const prompt = `Task: ${taskTitle}
Description: ${taskDescription || 'No description'}

How many days will this task take to complete? Consider complexity and typical project timelines. Respond with ONLY a number between 1 and 30.`;

    const response = await callGroqAPI(prompt, false);
    const daysText = response.trim().replace(/[^\d]/g, '');
    const days = parseInt(daysText);

    if (days && days >= 1 && days <= 30) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + days);
      return {
        success: true,
        estimatedDays: days,
        suggestedDeadline: deadline.toISOString().split('T')[0]
      };
    } else {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      return {
        success: true,
        estimatedDays: 7,
        suggestedDeadline: deadline.toISOString().split('T')[0]
      };
    }

  } catch (error) {
    console.error('❌ Deadline Suggestion Error:', error.message);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    return {
      success: false,
      estimatedDays: 7,
      suggestedDeadline: deadline.toISOString().split('T')[0]
    };
  }
}

/**
 * Get task completion tips
 */
async function getTaskTips(taskTitle, taskDescription) {
  try {
    const prompt = `Task: ${taskTitle}
Description: ${taskDescription || 'No description'}

Provide exactly 3 short, practical tips for completing this task effectively. Each tip should be concise (under 100 characters) and actionable.

Format: Return as JSON array of strings.
Example: ["Tip 1 here", "Tip 2 here", "Tip 3 here"]`;

    const response = await callGroqAPI(prompt, true);
    const parsed = JSON.parse(response);
    
    let tips = Array.isArray(parsed) ? parsed : (parsed.tips || []);
    tips = tips.map(tip => tip.trim()).filter(tip => tip.length > 0 && tip.length < 150).slice(0, 3);

    if (tips.length >= 3) {
      return {
        success: true,
        tips: tips
      };
    } else {
      const defaultTips = [
        'Break down into smaller steps',
        'Set clear milestones',
        'Review progress regularly'
      ];
      return {
        success: true,
        tips: [...tips, ...defaultTips].slice(0, 3)
      };
    }

  } catch (error) {
    console.error('❌ Tips Generation Error:', error.message);
    return {
      success: false,
      tips: [
        'Break down into smaller steps',
        'Set clear milestones',
        'Review progress regularly'
      ]
    };
  }
}

module.exports = {
  analyzeTask,
  suggestPriority,
  suggestDeadline,
  getTaskTips
};
