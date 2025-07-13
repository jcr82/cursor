const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const PersonalData = require('../models/PersonalData');
const { rateLimits } = require('../middleware/auth');

// Initialize services
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo-key');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const personalData = new PersonalData();

// Chat context store (in production, use Redis or similar)
const chatContexts = new Map();

// Helper function to create personalized prompt
function createPersonalizedPrompt(userMessage, personalContext = {}, conversationHistory = []) {
  let prompt = `You are a helpful AI assistant that answers questions about a specific person based on their personal information. You should respond naturally and conversationally, as if you know this person well.

IMPORTANT INSTRUCTIONS:
- Always refer to the person in third person (he/she/they) when answering questions about them
- Use the personal information provided to give specific, accurate answers
- If asked about something not in the personal data, say you don't have that information
- Be friendly, professional, and helpful
- Keep responses concise but informative
- If no personal context is provided, explain that you need personal data to answer specific questions about the person

`;

  // Add personal context if available
  if (Object.keys(personalContext).length > 0) {
    prompt += `PERSONAL INFORMATION ABOUT THE PERSON:\n`;
    
    if (personalContext.biography) {
      prompt += `\nBasic Info:\n`;
      prompt += `- Name: ${personalContext.biography.name}\n`;
      prompt += `- Title: ${personalContext.biography.title}\n`;
      prompt += `- Description: ${personalContext.biography.description}\n`;
      if (personalContext.biography.location) prompt += `- Location: ${personalContext.biography.location}\n`;
      if (personalContext.biography.background) prompt += `- Background: ${personalContext.biography.background}\n`;
    }

    if (personalContext.skills && personalContext.skills.length > 0) {
      prompt += `\nSkills:\n`;
      personalContext.skills.forEach(skill => {
        prompt += `- ${skill.name} (${skill.proficiency} level, ${skill.category})`;
        if (skill.yearsOfExperience) prompt += ` - ${skill.yearsOfExperience} years experience`;
        if (skill.description) prompt += ` - ${skill.description}`;
        prompt += `\n`;
      });
    }

    if (personalContext.projects && personalContext.projects.length > 0) {
      prompt += `\nRecent Projects:\n`;
      personalContext.projects.slice(0, 5).forEach(project => {
        prompt += `- ${project.name}: ${project.description}`;
        if (project.technologies) prompt += ` (Technologies: ${project.technologies.join(', ')})`;
        prompt += ` [Status: ${project.status}]\n`;
      });
    }

    if (personalContext.experience && personalContext.experience.length > 0) {
      prompt += `\nWork Experience:\n`;
      personalContext.experience.slice(0, 3).forEach(exp => {
        prompt += `- ${exp.position} at ${exp.company}`;
        if (exp.isCurrent) prompt += ` (Current)`;
        if (exp.description) prompt += `: ${exp.description}`;
        prompt += `\n`;
      });
    }

    if (personalContext.preferences) {
      prompt += `\nPreferences & Interests:\n`;
      if (personalContext.preferences.interests) prompt += `- Interests: ${personalContext.preferences.interests.join(', ')}\n`;
      if (personalContext.preferences.goals) prompt += `- Goals: ${personalContext.preferences.goals.join(', ')}\n`;
      if (personalContext.preferences.workStyle) prompt += `- Work Style: ${personalContext.preferences.workStyle}\n`;
    }
  }

  // Add conversation history for context
  if (conversationHistory.length > 0) {
    prompt += `\nRECENT CONVERSATION HISTORY:\n`;
    conversationHistory.slice(-4).forEach((msg, index) => {
      prompt += `${msg.role}: ${msg.content}\n`;
    });
  }

  prompt += `\nUSER QUESTION: ${userMessage}\n\nYour response should be helpful and based on the personal information provided above. If the question is about the person and you have relevant information, provide specific details. If you don't have the information, say so politely.`;

  return prompt;
}

// Helper function to manage chat context
function updateChatContext(sessionId, userMessage, aiResponse) {
  if (!chatContexts.has(sessionId)) {
    chatContexts.set(sessionId, []);
  }
  
  const context = chatContexts.get(sessionId);
  context.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: aiResponse }
  );
  
  // Keep only last 10 messages (5 exchanges)
  if (context.length > 10) {
    chatContexts.set(sessionId, context.slice(-10));
  }
}

// POST /api/chat - Enhanced chat with personal context
router.post('/', rateLimits.chat, async (req, res) => {
  try {
    const { message, sessionId = 'default', includePersonalContext = true } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Message is required' 
      });
    }

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'demo-key') {
      return res.json({
        response: `Hello! I'm your personalized AI assistant. You said: "${message}". 
        
To enable full AI capabilities with personalized responses, please:
1. Get a free API key from Google AI Studio (https://makersuite.google.com/app/apikey)
2. Add GEMINI_API_KEY=your_api_key_here to your .env file
3. Optionally add PERSONAL_DATA_API_KEY=your_secure_key for data protection
4. Restart the server

You can still use the personal data management API to add your information!`,
        isDemo: true,
        personalDataAvailable: false
      });
    }

    let personalContext = {};
    let personalDataAvailable = false;

    // Get personal context if requested
    if (includePersonalContext) {
      try {
        personalContext = await personalData.searchRelevantData(message);
        personalDataAvailable = Object.keys(personalContext).length > 0;
      } catch (error) {
        console.warn('Could not retrieve personal context:', error.message);
      }
    }

    // Get conversation history
    const conversationHistory = chatContexts.get(sessionId) || [];

    // Create personalized prompt
    const prompt = createPersonalizedPrompt(message, personalContext, conversationHistory);

    // Generate response using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Update chat context
    updateChatContext(sessionId, message, text);

    res.json({ 
      response: text,
      sessionId,
      personalDataUsed: personalDataAvailable,
      contextLength: conversationHistory.length,
      isDemo: false
    });

  } catch (error) {
    console.error('Error in chat:', error);
    
    // Handle specific Google AI errors
    if (error.message.includes('API key')) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid or missing Gemini API key'
      });
    }
    
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: 'Gemini API rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get AI response',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/chat/context - Get or clear chat context
router.post('/context', rateLimits.dataReading, async (req, res) => {
  try {
    const { sessionId = 'default', action = 'get' } = req.body;

    if (action === 'clear') {
      chatContexts.delete(sessionId);
      return res.json({
        success: true,
        message: 'Chat context cleared',
        sessionId
      });
    }

    const context = chatContexts.get(sessionId) || [];
    res.json({
      success: true,
      sessionId,
      context,
      length: context.length,
      message: 'Chat context retrieved'
    });

  } catch (error) {
    console.error('Error managing chat context:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to manage chat context'
    });
  }
});

// GET /api/chat/sessions - Get active chat sessions
router.get('/sessions', rateLimits.dataReading, async (req, res) => {
  try {
    const sessions = Array.from(chatContexts.keys()).map(sessionId => ({
      sessionId,
      messageCount: chatContexts.get(sessionId).length,
      lastActivity: new Date().toISOString() // In production, track this properly
    }));

    res.json({
      success: true,
      sessions,
      totalSessions: sessions.length,
      message: 'Active sessions retrieved'
    });

  } catch (error) {
    console.error('Error retrieving sessions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve sessions'
    });
  }
});

// POST /api/chat/preview - Preview what personal data would be used for a query
router.post('/preview', rateLimits.dataReading, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message is required for preview'
      });
    }

    const relevantData = await personalData.searchRelevantData(message);
    
    res.json({
      success: true,
      query: message,
      relevantData,
      dataFound: Object.keys(relevantData).length > 0,
      sections: Object.keys(relevantData),
      message: 'Preview data retrieved successfully'
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate preview'
    });
  }
});

// Health check for chat API
router.get('/health', (req, res) => {
  const geminiConfigured = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo-key');
  
  res.json({
    success: true,
    service: 'chat-api',
    status: 'healthy',
    geminiConfigured,
    activeSessions: chatContexts.size,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;