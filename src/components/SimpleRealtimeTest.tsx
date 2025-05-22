import React, { useState, useEffect, useRef } from 'react';

const SimpleRealtimeTest = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [clientId] = useState(`test-${Date.now()}`);
  const wsRef = useRef(null);
  const fileName = 'test-file';

  // Debug log function
  const log = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Test: ${message}`, data || '');
    
    setMessages(prev => [...prev.slice(-10), {
      time: timestamp,
      message,
      data: data ? JSON.stringify(data) : null
    }]);
  };

  // Connect to WebSocket
  useEffect(() => {
    const connect = () => {
      log('Attempting to connect to WebSocket...');
      
      const ws = new WebSocket('ws://localhost:4000');
      wsRef.current = ws;

      ws.onopen = () => {
        log('WebSocket connected!');
        setConnected(true);
        
        // Join the test file
        ws.send(JSON.stringify({
          type: 'join',
          fileName: fileName,
          clientId: clientId
        }));
        log('Sent join message', { fileName, clientId });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log('Received message', data);
          
          if (data.type === 'update' && data.fileName === fileName) {
            if (data.senderId !== clientId) {
              log('Updating text from external source');
              setText(data.content);
            } else {
              log('Ignoring own message');
            }
          }
        } catch (error) {
          log('Error parsing message', error.message);
        }
      };

      ws.onclose = () => {
        log('WebSocket disconnected');
        setConnected(false);
        
        // Reconnect after 2 seconds
        setTimeout(connect, 2000);
      };

      ws.onerror = (error) => {
        log('WebSocket error', error);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clientId]);

  // Handle text changes
  const handleTextChange = (event) => {
    const newText = event.target.value;
    setText(newText);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'update',
        fileName: fileName,
        content: newText,
        clientId: clientId
      };
      
      wsRef.current.send(JSON.stringify(message));
      log('Sent update message', { length: newText.length });
    }
  };

  // Test connection
  const testConnection = () => {
    if (wsRef.current) {
      log('Connection test', {
        readyState: wsRef.current.readyState,
        url: wsRef.current.url,
        connected
      });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Simple Real-Time Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> 
        <span style={{ 
          color: connected ? 'green' : 'red',
          marginLeft: '10px'
        }}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
        <button 
          onClick={testConnection}
          style={{ marginLeft: '10px', padding: '5px 10px' }}
        >
          Test Connection
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Client ID:</strong> {clientId}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>File:</strong> {fileName}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <strong>Text (type here to test real-time sync):</strong>
          <br />
          <textarea
            value={text}
            onChange={handleTextChange}
            style={{
              width: '100%',
              height: '100px',
              padding: '10px',
              fontSize: '14px',
              border: '2px solid #ccc',
              borderRadius: '4px',
              marginTop: '5px'
            }}
            placeholder="Type here... Changes should appear in other tabs instantly!"
          />
        </label>
      </div>

      <div>
        <strong>Debug Log:</strong>
        <div style={{
          height: '300px',
          overflow: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          backgroundColor: '#f9f9f9',
          fontSize: '12px'
        }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              <span style={{ color: '#666' }}>[{msg.time}]</span> {msg.message}
              {msg.data && (
                <div style={{ marginLeft: '20px', color: '#888' }}>
                  {msg.data}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f4f8' }}>
        <strong>How to test:</strong>
        <ol>
          <li>Open this page in two different browser tabs</li>
          <li>Make sure both show "🟢 Connected"</li>
          <li>Type in the textarea in one tab</li>
          <li>You should see the text appear in the other tab immediately</li>
          <li>Check the debug log for detailed information</li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleRealtimeTest;