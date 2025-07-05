# AI Chat Assistant

A modern, responsive web application for chatting with an AI assistant powered by Google's Gemini AI.

## Features

- 🤖 **AI-Powered Conversations**: Uses Google's Gemini Pro model for intelligent responses
- 💬 **Real-time Chat Interface**: Modern, responsive chat UI with smooth animations
- 🎨 **Beautiful Design**: Clean, professional interface with gradient backgrounds
- 📱 **Mobile Responsive**: Works perfectly on desktop, tablet, and mobile devices
- 🔒 **Error Handling**: Graceful error handling with user-friendly messages
- ⚡ **Fast & Lightweight**: Optimized for performance

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **AI Integration**: Google Gemini Pro API
- **Styling**: Custom CSS with gradients and animations

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-chat-app
npm install
```

### 2. Set up Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Get a Free Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key to your `.env` file

### 4. Run the Application

```bash
# For development (with auto-restart)
npm run dev

# For production
npm start
```

### 5. Open in Browser

Visit `http://localhost:3000` to start chatting!

## Project Structure

```
ai-chat-app/
├── public/
│   ├── index.html      # Main HTML file
│   ├── style.css       # Styling and animations
│   └── script.js       # Frontend JavaScript
├── server.js           # Express server and API routes
├── package.json        # Dependencies and scripts
├── .env               # Environment variables (create this)
└── README.md          # This file
```

## API Endpoints

- `GET /` - Serves the main chat interface
- `POST /api/chat` - Handles chat messages and AI responses
- `GET /api/health` - Health check endpoint

## Demo Mode

The application includes a demo mode that works without an API key. When no API key is provided, it will:
- Show a demo response explaining how to set up the full functionality
- Display the complete chat interface
- Demonstrate all UI features

## Customization

### Styling
- Modify `public/style.css` to change colors, fonts, or layout
- The app uses CSS custom properties for easy theming

### AI Behavior
- Edit the AI prompt in `server.js` to change the assistant's personality
- Modify the model parameters for different response styles

## Troubleshooting

### Common Issues

1. **"Module not found" error**: Run `npm install` to install dependencies
2. **API key not working**: Ensure your `.env` file is in the root directory
3. **Port already in use**: Change the PORT in `.env` or kill the process using port 3000

### Development Tips

- Use `npm run dev` for development (auto-restart on file changes)
- Check the browser console for JavaScript errors
- Monitor the terminal for server-side errors

## Security Notes

- Never commit your `.env` file to version control
- The API key is kept server-side for security
- Input sanitization is implemented to prevent XSS attacks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please check the troubleshooting section or open an issue on the repository.

---

Enjoy chatting with your AI assistant! 🤖✨