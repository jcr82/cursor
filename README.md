# Personalized Chatbot API

A comprehensive AI-powered chatbot system that provides personalized responses based on your personal data. Built with Google Gemini AI and a custom personal data management API.

## 🚀 Features

### 🤖 **Personalized AI Chat**
- **Context-Aware Responses**: AI assistant that knows about you personally
- **Google Gemini Integration**: Powered by Google's latest Gemini Pro model
- **Smart Data Retrieval**: Automatically finds relevant personal information for each query
- **Conversation Memory**: Maintains context across conversation sessions
- **Demo Mode**: Works without API keys for testing the interface

### 📊 **Personal Data Management**
- **Comprehensive Profile**: Manage biography, skills, projects, experience, education
- **RESTful API**: Full CRUD operations for all personal data sections
- **Data Validation**: Joi-based validation ensures data integrity
- **Structured Storage**: JSON-based storage with proper schema validation
- **Search Functionality**: Smart search to find relevant data for AI context

### 🔐 **Security & Privacy**
- **API Key Authentication**: Secure your personal data with custom API keys
- **Rate Limiting**: Prevents abuse with configurable rate limits
- **Request Logging**: Track all API usage with detailed logs
- **Security Headers**: Comprehensive security middleware with Helmet.js
- **Input Validation**: All inputs are sanitized and validated

### 🎨 **Modern Web Interface**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Tab Navigation**: Organized interface with Chat, Profile, and Settings tabs
- **Real-time Status**: Live indicators for AI and data service health
- **Interactive Forms**: Dynamic forms for managing personal data
- **Notification System**: User-friendly notifications for all actions

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [Development](#development)
- [Security](#security)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🚀 Quick Start

### 1. **Clone and Install**

```bash
git clone <your-repo-url>
cd personalized-chatbot-api
npm install
```

### 2. **Configure Environment**

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PERSONAL_DATA_API_KEY=your_secure_api_key  # Optional
```

### 3. **Get Your Gemini API Key**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key to your `.env` file

### 4. **Start the Application**

```bash
npm start
```

Visit `http://localhost:3000` to start using your personalized chatbot!

## 📦 Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Google Gemini API Key** (free)

### Install Dependencies

```bash
npm install
```

### Development Mode (with auto-restart)

```bash
npm run dev
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key | - |
| `PERSONAL_DATA_API_KEY` | No | Secures personal data endpoints | - |
| `PORT` | No | Server port | `3000` |
| `NODE_ENV` | No | Environment mode | `development` |
| `JWT_SECRET` | No | JWT secret for future features | - |
| `ALLOWED_ORIGINS` | No | CORS allowed origins | All origins |

### Security Configuration

For production use, set these environment variables:

```env
PERSONAL_DATA_API_KEY=your_secure_random_key
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Personal data endpoints require the `X-API-Key` header when `PERSONAL_DATA_API_KEY` is set.

### Endpoints

#### **Chat API**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send message to AI assistant |
| `POST` | `/chat/context` | Manage chat context |
| `GET` | `/chat/sessions` | Get active sessions |
| `POST` | `/chat/preview` | Preview data for query |
| `GET` | `/chat/health` | Chat service health |

#### **Personal Data API**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/personal-data` | Get all personal data |
| `PUT` | `/personal-data` | Update all personal data |
| `GET` | `/personal-data/:section` | Get specific section |
| `PUT` | `/personal-data/:section` | Update specific section |
| `POST` | `/personal-data/search` | Search for relevant data |
| `POST` | `/personal-data/validate` | Validate data structure |
| `GET` | `/personal-data/schema/info` | Get schema information |

#### **System API**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Overall system health |
| `GET` | `/docs` | API documentation |

## 💡 Usage Examples

### Chat with Personal Context

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my recent projects?",
    "sessionId": "user123",
    "includePersonalContext": true
  }'
```

### Update Personal Biography

```bash
curl -X PUT http://localhost:3000/api/personal-data/biography \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "John Doe",
    "title": "Full Stack Developer",
    "description": "Passionate developer with 5 years experience",
    "location": "San Francisco, CA"
  }'
```

### Add a New Skill

```bash
curl -X PUT http://localhost:3000/api/personal-data/skills \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '[{
    "name": "React",
    "category": "programming",
    "proficiency": "advanced",
    "yearsOfExperience": 3
  }]'
```

## 🛠️ Development

### Project Structure

```
personalized-chatbot-api/
├── config/                 # Configuration files
├── data/                   # Personal data storage
├── middleware/             # Express middleware
├── models/                 # Data models and schemas
├── public/                 # Frontend files
├── routes/                 # API routes
├── server.js              # Main server file
├── package.json           # Dependencies
└── README.md              # This file
```

### Data Schema

The personal data follows this structure:

```json
{
  "biography": {
    "name": "string",
    "title": "string", 
    "description": "string",
    "location": "string"
  },
  "skills": [{
    "name": "string",
    "category": "programming|tools|soft-skills",
    "proficiency": "beginner|intermediate|advanced|expert"
  }],
  "projects": [{
    "name": "string",
    "description": "string",
    "technologies": ["string"],
    "status": "completed|in-progress|planned|archived"
  }],
  "experience": [{
    "company": "string",
    "position": "string",
    "description": "string",
    "isCurrent": "boolean"
  }]
}
```

### Adding New Features

1. **Backend**: Add routes in `/routes/` directory
2. **Frontend**: Update `/public/` files
3. **Data Model**: Modify `/models/PersonalData.js`
4. **Middleware**: Add security/validation in `/middleware/`

## 🔒 Security

### Security Features

- **Helmet.js**: Security headers for all responses
- **Rate Limiting**: Configurable rate limits per endpoint type
- **Input Validation**: Joi schema validation for all inputs
- **API Key Authentication**: Optional secure access to personal data
- **CORS Configuration**: Configurable cross-origin settings
- **Request Logging**: Comprehensive request/response logging

### Best Practices

1. **Always set** `PERSONAL_DATA_API_KEY` in production
2. **Use HTTPS** for production deployments
3. **Limit CORS origins** to your domain only
4. **Monitor logs** for suspicious activity
5. **Regular updates** of dependencies

### Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General | 100 requests | 15 minutes |
| Chat | 20 requests | 1 minute |
| Data Modification | 10 requests | 5 minutes |
| Data Reading | 50 requests | 1 minute |

## 🚀 Deployment

### Environment Setup

```bash
# Production environment
NODE_ENV=production
GEMINI_API_KEY=your_production_api_key
PERSONAL_DATA_API_KEY=your_secure_production_key
ALLOWED_ORIGINS=https://yourdomain.com
PORT=3000
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Heroku Deployment

```bash
heroku create your-app-name
heroku config:set GEMINI_API_KEY=your_key
heroku config:set PERSONAL_DATA_API_KEY=your_secure_key
git push heroku main
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Test thoroughly before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for providing the powerful language model
- **Express.js** for the robust web framework
- **The open-source community** for amazing libraries and tools

## 📞 Support

- **Documentation**: Check `/api/docs` endpoint for interactive API docs
- **Health Check**: Visit `/api/health` for system status
- **Issues**: Report bugs and feature requests via GitHub issues

---

**Happy Chatting!** 🤖✨

Start building your personalized AI assistant today and experience the power of context-aware conversations!