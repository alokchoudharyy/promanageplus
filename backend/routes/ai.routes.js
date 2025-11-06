// ═══════════════════════════════════════════════════════════
// AI ROUTES - Separate endpoint for AI analysis
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();

// Load AI service
let aiService;
try {
  aiService = require('../services/aiService');
} catch (err) {
  console.error('⚠️ AI Service not available:', err.message);
}

/**
 * POST /api/ai/analyze-task
 * Analyze task and return AI suggestions WITHOUT creating task
 */
router.post('/analyze-task', async (req, res) => {
  try {
    const { title, description } = req.body;

    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    // Check if AI service is available
    if (!aiService) {
      console.warn('⚠️ AI Service not loaded, using defaults');
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      
      return res.json({
        success: false,
        error: 'AI service unavailable',
        data: {
          priority: 'medium',
          estimatedDays: 7,
          complexity: 'moderate',
          suggestedDeadline: deadline.toISOString().split('T')[0],
          reasoning: 'AI service is currently unavailable. Using default values.',
          suggestions: [
            'Break down the task into smaller steps',
            'Set clear milestones and checkpoints',
            'Review progress regularly'
          ]
        }
      });
    }

    console.log('🤖 AI Analysis requested for:', title);

    // Call AI service
    const result = await aiService.analyzeTask(title, description || '');

    console.log('✅ AI Analysis result:', result);

    res.json(result);

  } catch (error) {
    console.error('❌ AI Analysis Error:', error);
    
    // Return fallback data on error
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    
    res.json({
      success: false,
      error: error.message,
      data: {
        priority: 'medium',
        estimatedDays: 7,
        complexity: 'moderate',
        suggestedDeadline: deadline.toISOString().split('T')[0],
        reasoning: 'AI analysis failed. Using default values.',
        suggestions: [
          'Break down the task into smaller steps',
          'Set clear milestones and checkpoints',
          'Review progress regularly'
        ]
      }
    });
  }
});

/**
 * POST /api/ai/suggest-priority
 * Quick priority suggestion only
 */
router.post('/suggest-priority', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!aiService) {
      return res.json({ success: true, priority: 'medium' });
    }

    const result = await aiService.suggestPriority(title, description || '');
    res.json(result);

  } catch (error) {
    console.error('❌ Priority Suggestion Error:', error);
    res.json({ success: false, priority: 'medium' });
  }
});

/**
 * POST /api/ai/suggest-deadline
 * Quick deadline suggestion only
 */
router.post('/suggest-deadline', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!aiService) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      return res.json({
        success: true,
        estimatedDays: 7,
        suggestedDeadline: deadline.toISOString().split('T')[0]
      });
    }

    const result = await aiService.suggestDeadline(title, description || '');
    res.json(result);

  } catch (error) {
    console.error('❌ Deadline Suggestion Error:', error);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    res.json({
      success: false,
      estimatedDays: 7,
      suggestedDeadline: deadline.toISOString().split('T')[0]
    });
  }
});

/**
 * POST /api/ai/task-tips
 * Get completion tips for a task
 */
router.post('/task-tips', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!aiService) {
      return res.json({
        success: true,
        tips: [
          'Break down into smaller steps',
          'Set clear milestones',
          'Review progress regularly'
        ]
      });
    }

    const result = await aiService.getTaskTips(title, description || '');
    res.json(result);

  } catch (error) {
    console.error('❌ Tips Generation Error:', error);
    res.json({
      success: false,
      tips: [
        'Break down into smaller steps',
        'Set clear milestones',
        'Review progress regularly'
      ]
    });
  }
});

module.exports = router;
