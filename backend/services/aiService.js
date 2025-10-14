const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// ═══════════════════════════════════════════════════════════
// AI SERVICE - TASK INTELLIGENCE
// ═══════════════════════════════════════════════════════════

/**
 * Analyze task and get AI suggestions
 */
async function analyzeTask(taskTitle, taskDescription) {
  try {
    const prompt = `
You are a project management AI assistant. Analyze this task and provide structured predictions.

Task Title: ${taskTitle}
Task Description: ${taskDescription || 'No description provided'}

Provide your analysis in this exact JSON format (no markdown, just pure JSON):
{
  "priority": "high" or "medium" or "low",
  "estimatedDays": number (1-30),
  "complexity": "simple" or "moderate" or "complex",
  "suggestedDeadline": "YYYY-MM-DD",
  "reasoning": "Brief explanation of your analysis",
  "suggestions": ["tip1", "tip2", "tip3"]
}

Rules:
- priority: "high" if urgent/critical/deadline-sensitive, "low" if routine/minor, "medium" otherwise
- estimatedDays: realistic number of days needed (1-30)
- complexity: "simple" if basic task, "complex" if requires multiple steps/skills, "moderate" otherwise
- suggestedDeadline: today's date + estimatedDays
- reasoning: 1-2 sentences explaining why you chose this priority and timeline
- suggestions: 3 actionable tips to complete this task efficiently

Respond ONLY with the JSON object, no other text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let analysis;
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', text);
      // Fallback to default values
      analysis = {
        priority: 'medium',
        estimatedDays: 7,
        complexity: 'moderate',
        suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reasoning: 'Unable to analyze task details. Using default values.',
        suggestions: [
          'Break down the task into smaller steps',
          'Set clear milestones',
          'Review progress regularly'
        ]
      };
    }

    return {
      success: true,
      data: analysis
    };

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      success: false,
      error: error.message,
      data: {
        priority: 'medium',
        estimatedDays: 7,
        complexity: 'moderate',
        suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reasoning: 'AI service unavailable. Using default values.',
        suggestions: []
      }
    };
  }
}

/**
 * Get priority suggestion only (faster)
 */
async function suggestPriority(taskTitle, taskDescription) {
  try {
    const prompt = `
Analyze this task and suggest only the priority level.

Task: ${taskTitle}
Description: ${taskDescription || 'No description'}

Respond with ONLY one word: "high", "medium", or "low"

Rules:
- "high": urgent, critical, time-sensitive, blocks other tasks
- "medium": important but not urgent, standard work items
- "low": nice-to-have, routine maintenance, non-critical

Your response (one word only):
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const priority = response.text().trim().toLowerCase();

    // Validate response
    const validPriorities = ['high', 'medium', 'low'];
    if (validPriorities.includes(priority)) {
      return { success: true, priority };
    } else {
      return { success: true, priority: 'medium' };
    }

  } catch (error) {
    console.error('Priority Suggestion Error:', error);
    return { success: false, priority: 'medium' };
  }
}

/**
 * Get deadline suggestion only (faster)
 */
async function suggestDeadline(taskTitle, taskDescription) {
  try {
    const prompt = `
Analyze this task and suggest how many days it will take to complete.

Task: ${taskTitle}
Description: ${taskDescription || 'No description'}

Respond with ONLY a number between 1 and 30 (number of days needed).

Consider:
- Task complexity
- Typical time for similar tasks
- Dependencies and research needed

Your response (single number only):
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const daysText = response.text().trim();
    const days = parseInt(daysText);

    // Validate and calculate deadline
    if (days && days >= 1 && days <= 30) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + days);
      return {
        success: true,
        estimatedDays: days,
        suggestedDeadline: deadline.toISOString().split('T')[0]
      };
    } else {
      // Default to 7 days
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      return {
        success: true,
        estimatedDays: 7,
        suggestedDeadline: deadline.toISOString().split('T')[0]
      };
    }

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
}

/**
 * Get task completion tips
 */
async function getTaskTips(taskTitle, taskDescription) {
  try {
    const prompt = `
Provide 3 practical tips for completing this task efficiently.

Task: ${taskTitle}
Description: ${taskDescription || 'No description'}

Respond with 3 short, actionable tips (one per line, no numbers or bullets).
Each tip should be max 10 words.

Example format:
Break task into smaller milestones
Use project management tools
Set daily progress checkpoints
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Split into array
    const tips = text
      .split('\n')
      .map(tip => tip.replace(/^[-•\d.)\s]+/, '').trim())
      .filter(tip => tip.length > 0)
      .slice(0, 3);

    return {
      success: true,
      tips: tips.length > 0 ? tips : [
        'Break down into smaller steps',
        'Set clear milestones',
        'Review progress regularly'
      ]
    };

  } catch (error) {
    console.error('Tips Generation Error:', error);
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
