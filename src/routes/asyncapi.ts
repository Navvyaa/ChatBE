import express from 'express';

const router = express.Router();

router.get('/', (_req, res) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Socket.IO Events Documentation</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #fafafa;
      color: #333;
      line-height: 1.6;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header h1 {
      font-size: 36px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .header p {
      font-size: 18px;
      opacity: 0.95;
    }
    .nav-bar {
      background: white;
      border-bottom: 2px solid #e1e4e8;
      padding: 15px 20px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .nav-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .nav-link {
      padding: 10px 20px;
      background: #4caf50;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s;
    }
    .nav-link:hover {
      background: #45a049;
      transform: translateY(-1px);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 30px 20px;
    }
    .info-box {
      background: linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%);
      border-left: 5px solid #2196f3;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .info-box h2 {
      color: #1565c0;
      margin-bottom: 15px;
      font-size: 22px;
    }
    .info-box p {
      margin: 10px 0;
      font-size: 15px;
    }
    .info-box code {
      background: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #d63384;
      border: 1px solid #dee2e6;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 28px;
      color: #2c3e50;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    .event-card {
      background: white;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid #667eea;
      transition: all 0.2s;
    }
    .event-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      transform: translateX(4px);
    }
    .event-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .event-name {
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
      font-family: 'Courier New', monospace;
    }
    .event-badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-emit {
      background: #4caf50;
      color: white;
    }
    .badge-receive {
      background: #2196f3;
      color: white;
    }
    .event-description {
      color: #555;
      margin-bottom: 15px;
      font-size: 15px;
    }
    .event-params {
      margin-top: 15px;
    }
    .params-title {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .param-item {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 8px;
      border-left: 3px solid #6c757d;
    }
    .param-name {
      font-family: 'Courier New', monospace;
      color: #d63384;
      font-weight: 600;
      font-size: 14px;
    }
    .param-type {
      color: #0066cc;
      font-size: 13px;
      font-style: italic;
    }
    .param-required {
      color: #dc3545;
      font-size: 12px;
      font-weight: 600;
    }
    .param-description {
      color: #666;
      margin-top: 5px;
      font-size: 14px;
    }
    .example-code {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 15px;
      border-radius: 6px;
      margin-top: 10px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
    .code-comment {
      color: #6a9955;
    }
    .code-string {
      color: #ce9178;
    }
    .code-keyword {
      color: #569cd6;
    }
    .auth-section {
      background: #fff3cd;
      border-left: 5px solid #ffc107;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .auth-section h2 {
      color: #856404;
      margin-bottom: 12px;
    }
    .auth-section p {
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <h1>🔌 Socket.IO WebSocket Events</h1>
      <p>Real-time event-driven API documentation for the Chat Application</p>
    </div>
  </div>
  
  <div class="nav-bar">
    <div class="nav-content">
      <a href="/api-docs" class="nav-link">📚 REST API (Swagger)</a>
      <a href="/socket-tester.html" class="nav-link">🧪 Socket Tester</a>
      <a href="/" class="nav-link">🏠 Home</a>
    </div>
  </div>

  <div class="container">
    <div class="auth-section">
      <h2>🔐 Authentication Required</h2>
      <p><strong>Connection:</strong> All Socket.IO connections require JWT authentication.</p>
      <div class="example-code">
<span class="code-keyword">import</span> { io } <span class="code-keyword">from</span> <span class="code-string">'socket.io-client'</span>;

<span class="code-keyword">const</span> socket = io(<span class="code-string">'http://localhost:5000'</span>, {
  auth: {
    token: <span class="code-string">'your_jwt_token_here'</span>
  }
});
      </div>
    </div>

    <div class="info-box">
      <h2>🚀 Quick Start Guide</h2>
      <p><strong>Step 1:</strong> Obtain JWT token by logging in via the <a href="/api-docs">REST API</a> (POST /api/auth/login)</p>
      <p><strong>Step 2:</strong> Connect to Socket.IO with the token in the auth object</p>
      <p><strong>Step 3:</strong> Join a conversation using <code>joinConversation</code> event</p>
      <p><strong>Step 4:</strong> Emit and listen to events as documented below</p>
      <p><strong>Step 5:</strong> Test everything using the <a href="/socket-tester.html">Interactive Socket.IO Tester</a></p>
    </div>

    <!-- CLIENT EMITS (Publish) -->
    <div class="section">
      <h2 class="section-title">📤 Client Events (Emit)</h2>
      <p style="margin-bottom: 20px; color: #666;">Events that the client can emit to the server</p>

      <!-- joinConversation -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">joinConversation</span>
          <span class="event-badge badge-emit">Client Emits</span>
        </div>
        <div class="event-description">
          Join a conversation room to send and receive messages. You must join before sending messages.
          Auto-marks all unread messages in the conversation as read.
        </div>
        <div class="event-params">
          <div class="params-title">Parameters:</div>
          <div class="param-item">
            <div><span class="param-name">conversationId</span> <span class="param-type">(string)</span> <span class="param-required">required</span></div>
            <div class="param-description">MongoDB ObjectId of the conversation to join</div>
          </div>
        </div>
        <div class="example-code">
socket.emit(<span class="code-string">'joinConversation'</span>, {
  conversationId: <span class="code-string">'507f1f77bcf86cd799439011'</span>
});

<span class="code-comment">// Listen for confirmation</span>
socket.on(<span class="code-string">'joined'</span>, (data) => {
  console.log(<span class="code-string">'Joined conversation:'</span>, data.conversationId);
});
        </div>
      </div>

      <!-- leaveConversation -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">leaveConversation</span>
          <span class="event-badge badge-emit">Client Emits</span>
        </div>
        <div class="event-description">
          Leave the currently joined conversation room. You won't receive new messages until you join again.
        </div>
        <div class="example-code">
socket.emit(<span class="code-string">'leaveConversation'</span>, {});
        </div>
      </div>

      <!-- sendMessage -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">sendMessage</span>
          <span class="event-badge badge-emit">Client Emits</span>
        </div>
        <div class="event-description">
          Send a message in the joined conversation. Must call <code>joinConversation</code> first.
        </div>
        <div class="event-params">
          <div class="params-title">Parameters:</div>
          <div class="param-item">
            <div><span class="param-name">content</span> <span class="param-type">(string)</span> <span class="param-required">required</span></div>
            <div class="param-description">The message text content</div>
          </div>
        </div>
        <div class="example-code">
socket.emit(<span class="code-string">'sendMessage'</span>, {
  content: <span class="code-string">'Hello! How are you?'</span>
});

<span class="code-comment">// You and the recipient will receive</span>
socket.on(<span class="code-string">'private-message'</span>, (message) => {
  console.log(<span class="code-string">'New message:'</span>, message);
});
        </div>
      </div>

      <!-- typing-start -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">typing-start</span>
          <span class="event-badge badge-emit">Client Emits</span>
        </div>
        <div class="event-description">
          Notify other participants that you started typing. Must be in a joined conversation.
        </div>
        <div class="example-code">
socket.emit(<span class="code-string">'typing-start'</span>, {});

<span class="code-comment">// Other users will receive</span>
socket.on(<span class="code-string">'user-typing'</span>, (data) => {
  <span class="code-keyword">if</span> (data.isTyping) {
    console.log(<span class="code-string">'User is typing...'</span>);
  }
});
        </div>
      </div>

      <!-- typing-stop -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">typing-stop</span>
          <span class="event-badge badge-emit">Client Emits</span>
        </div>
        <div class="event-description">
          Notify other participants that you stopped typing.
        </div>
        <div class="example-code">
socket.emit(<span class="code-string">'typing-stop'</span>, {});
        </div>
      </div>

      <!-- markConversationAsRead -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">markConversationAsRead</span>
          <span class="event-badge badge-emit">Client Emits</span>
        </div>
        <div class="event-description">
          Manually mark all messages in a conversation as read. (Note: this happens automatically when you join)
        </div>
        <div class="event-params">
          <div class="params-title">Parameters:</div>
          <div class="param-item">
            <div><span class="param-name">conversationId</span> <span class="param-type">(string)</span> <span class="param-required">required</span></div>
            <div class="param-description">ID of the conversation</div>
          </div>
        </div>
        <div class="example-code">
socket.emit(<span class="code-string">'markConversationAsRead'</span>, {
  conversationId: <span class="code-string">'507f1f77bcf86cd799439011'</span>
});
        </div>
      </div>

      <!-- joinedMultipleConversations -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">joinedMultipleConversations</span>
          <span class="event-badge badge-emit">Client Emits</span>
        </div>
        <div class="event-description">
          Join multiple conversation rooms at once. Useful for receiving notifications from all active conversations.
        </div>
        <div class="event-params">
          <div class="params-title">Parameters:</div>
          <div class="param-item">
            <div><span class="param-name">conversationIds</span> <span class="param-type">(string[])</span> <span class="param-required">required</span></div>
            <div class="param-description">Array of conversation IDs to join</div>
          </div>
        </div>
        <div class="example-code">
socket.emit(<span class="code-string">'joinedMultipleConversations'</span>, {
  conversationIds: [
    <span class="code-string">'507f1f77bcf86cd799439011'</span>,
    <span class="code-string">'507f1f77bcf86cd799439012'</span>,
    <span class="code-string">'507f1f77bcf86cd799439013'</span>
  ]
});

socket.on(<span class="code-string">'joinedMultiple'</span>, (data) => {
  console.log(<span class="code-string">'Join results:'</span>, data.results);
});
        </div>
      </div>
    </div>

    <!-- SERVER EMITS (Subscribe) -->
    <div class="section">
      <h2 class="section-title">📥 Server Events (Receive)</h2>
      <p style="margin-bottom: 20px; color: #666;">Events that the server emits to the client</p>

      <!-- joined -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">joined</span>
          <span class="event-badge badge-receive">Server Emits</span>
        </div>
        <div class="event-description">
          Confirmation that you successfully joined a conversation room.
        </div>
        <div class="event-params">
          <div class="params-title">Response Data:</div>
          <div class="param-item">
            <div><span class="param-name">conversationId</span> <span class="param-type">(string)</span></div>
            <div class="param-description">The conversation you joined</div>
          </div>
        </div>
        <div class="example-code">
socket.on(<span class="code-string">'joined'</span>, (data) => {
  console.log(<span class="code-string">'Successfully joined:'</span>, data.conversationId);
});
        </div>
      </div>

      <!-- private-message -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">private-message</span>
          <span class="event-badge badge-receive">Server Emits</span>
        </div>
        <div class="event-description">
          A new message was sent or received in the conversation. This is the main event for real-time messaging.
        </div>
        <div class="event-params">
          <div class="params-title">Response Data:</div>
          <div class="param-item">
            <div><span class="param-name">_id</span> <span class="param-type">(string)</span></div>
            <div class="param-description">Message ID</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">conversation</span> <span class="param-type">(string)</span></div>
            <div class="param-description">Conversation ID</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">sender</span> <span class="param-type">(string)</span></div>
            <div class="param-description">Sender user ID</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">receiver</span> <span class="param-type">(string)</span></div>
            <div class="param-description">Receiver user ID</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">content</span> <span class="param-type">(string)</span></div>
            <div class="param-description">Message text</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">delivered</span> <span class="param-type">(boolean)</span></div>
            <div class="param-description">Whether message was delivered</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">read</span> <span class="param-type">(boolean)</span></div>
            <div class="param-description">Whether message was read</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">createdAt</span> <span class="param-type">(string)</span></div>
            <div class="param-description">ISO timestamp</div>
          </div>
        </div>
        <div class="example-code">
socket.on(<span class="code-string">'private-message'</span>, (message) => {
  console.log(<span class="code-string">'New message:'</span>, {
    from: message.sender,
    content: message.content,
    time: message.createdAt
  });
});
        </div>
      </div>

      <!-- message-delivered -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">message-delivered</span>
          <span class="event-badge badge-receive">Server Emits</span>
        </div>
        <div class="event-description">
          Notification that your message was delivered to the recipient (they received it but may not have read it yet).
        </div>
        <div class="event-params">
          <div class="params-title">Response Data:</div>
          <div class="param-item">
            <div><span class="param-name">messageId</span> <span class="param-type">(string)</span></div>
            <div class="param-description">ID of the delivered message</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">deliveredAt</span> <span class="param-type">(string)</span></div>
            <div class="param-description">ISO timestamp of delivery</div>
          </div>
        </div>
        <div class="example-code">
socket.on(<span class="code-string">'message-delivered'</span>, (data) => {
  console.log(<span class="code-string">'Message delivered:'</span>, data.messageId);
  <span class="code-comment">// Update UI to show single checkmark</span>
});
        </div>
      </div>

      <!-- messages-read -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">messages-read</span>
          <span class="event-badge badge-receive">Server Emits</span>
        </div>
        <div class="event-description">
          Notification that your messages were read by the recipient. Includes count of how many messages were marked read.
        </div>
        <div class="event-params">
          <div class="params-title">Response Data:</div>
          <div class="param-item">
            <div><span class="param-name">conversationId</span> <span class="param-type">(string)</span></div>
            <div class="param-description">Conversation ID</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">readBy</span> <span class="param-type">(string)</span></div>
            <div class="param-description">User ID who read the messages</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">readAt</span> <span class="param-type">(string)</span></div>
            <div class="param-description">ISO timestamp</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">count</span> <span class="param-type">(number)</span></div>
            <div class="param-description">Number of messages marked as read</div>
          </div>
        </div>
        <div class="example-code">
socket.on(<span class="code-string">'messages-read'</span>, (data) => {
  console.log(<span class="code-string">\`\${data.count} messages read by \${data.readBy}\`</span>);
  <span class="code-comment">// Update UI to show double checkmark (blue ticks)</span>
});
        </div>
      </div>

      <!-- user-typing -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">user-typing</span>
          <span class="event-badge badge-receive">Server Emits</span>
        </div>
        <div class="event-description">
          Real-time typing indicator when another user in the conversation starts or stops typing.
        </div>
        <div class="event-params">
          <div class="params-title">Response Data:</div>
          <div class="param-item">
            <div><span class="param-name">conversationId</span> <span class="param-type">(string)</span></div>
            <div class="param-description">Conversation ID</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">userId</span> <span class="param-type">(string)</span></div>
            <div class="param-description">User who is typing</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">isTyping</span> <span class="param-type">(boolean)</span></div>
            <div class="param-description">true = started typing, false = stopped</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">timestamp</span> <span class="param-type">(number)</span></div>
            <div class="param-description">Unix timestamp in milliseconds</div>
          </div>
        </div>
        <div class="example-code">
socket.on(<span class="code-string">'user-typing'</span>, (data) => {
  <span class="code-keyword">if</span> (data.isTyping) {
    console.log(<span class="code-string">'User is typing...'</span>);
  } <span class="code-keyword">else</span> {
    console.log(<span class="code-string">'User stopped typing'</span>);
  }
});
        </div>
      </div>

      <!-- user-status-changed -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">user-status-changed</span>
          <span class="event-badge badge-receive">Server Emits</span>
        </div>
        <div class="event-description">
          User presence update when someone goes online, offline, or away. Automatically sent on connect/disconnect.
        </div>
        <div class="event-params">
          <div class="params-title">Response Data:</div>
          <div class="param-item">
            <div><span class="param-name">userId</span> <span class="param-type">(string)</span></div>
            <div class="param-description">User ID whose status changed</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">status</span> <span class="param-type">(string)</span></div>
            <div class="param-description">ONLINE | OFFLINE | AWAY</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">timestamp</span> <span class="param-type">(number)</span></div>
            <div class="param-description">Unix timestamp</div>
          </div>
          <div class="param-item">
            <div><span class="param-name">lastSeen</span> <span class="param-type">(number, optional)</span></div>
            <div class="param-description">Only present when status is OFFLINE</div>
          </div>
        </div>
        <div class="example-code">
socket.on(<span class="code-string">'user-status-changed'</span>, (data) => {
  console.log(<span class="code-string">\`User \${data.userId} is now \${data.status}\`</span>);
  <span class="code-comment">// Show green/gray dot in UI</span>
});
        </div>
      </div>

      <!-- joinedMultiple -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">joinedMultiple</span>
          <span class="event-badge badge-receive">Server Emits</span>
        </div>
        <div class="event-description">
          Response to <code>joinedMultipleConversations</code> showing which conversations were successfully joined.
        </div>
        <div class="event-params">
          <div class="params-title">Response Data:</div>
          <div class="param-item">
            <div><span class="param-name">results</span> <span class="param-type">(array)</span></div>
            <div class="param-description">Array of objects with conversationId and status (joined or denied)</div>
          </div>
        </div>
        <div class="example-code">
socket.on(<span class="code-string">'joinedMultiple'</span>, (data) => {
  data.results.forEach(result => {
    console.log(<span class="code-string">\`\${result.conversationId}: \${result.status}\`</span>);
  });
});
        </div>
      </div>

      <!-- error -->
      <div class="event-card">
        <div class="event-header">
          <span class="event-name">error</span>
          <span class="event-badge badge-receive">Server Emits</span>
        </div>
        <div class="event-description">
          Error notification when something goes wrong (e.g., trying to send message without joining conversation).
        </div>
        <div class="event-params">
          <div class="params-title">Response Data:</div>
          <div class="param-item">
            <div><span class="param-name">message</span> <span class="param-type">(string)</span></div>
            <div class="param-description">Error description</div>
          </div>
        </div>
        <div class="example-code">
socket.on(<span class="code-string">'error'</span>, (data) => {
  console.error(<span class="code-string">'Socket.IO error:'</span>, data.message);
});
        </div>
      </div>
    </div>

    <div class="info-box">
      <h2>💡 Best Practices</h2>
      <p><strong>1. Always join before sending:</strong> Call <code>joinConversation</code> before <code>sendMessage</code></p>
      <p><strong>2. Handle disconnections:</strong> Listen to <code>disconnect</code> event and reconnect with authentication</p>
      <p><strong>3. Typing indicators:</strong> Use debouncing - emit <code>typing-start</code> on first keystroke, then <code>typing-stop</code> after 2-3 seconds of inactivity</p>
      <p><strong>4. Message status:</strong> Listen to <code>message-delivered</code> and <code>messages-read</code> to show delivery/read receipts</p>
      <p><strong>5. Multiple conversations:</strong> Use <code>joinedMultipleConversations</code> to receive notifications from all active chats</p>
    </div>
  </div>
</body>
</html>
  `;

    res.send(htmlContent);
});

export default router;
