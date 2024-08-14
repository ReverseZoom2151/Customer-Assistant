'use client'
import { useState } from "react";
import { Box, Stack, TextField, Button } from "@mui/material";

export default function Home() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi! I'm the Headstarter Support Agent, how can I assist you today?`
  }]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setError(null);
    setLoading(true);

    const newMessages = [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ];

    setMessages(newMessages);
    setMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessages),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        result += chunk;
        
        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          const otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + chunk,
            },
          ];
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      width="100vw" 
      height="100vh" 
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
    >
      <Stack
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack 
          direction="column" 
          spacing={2} 
          flexGrow={1} 
          overflow="auto" 
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box 
              key={index} 
              display='flex' 
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction = "row" spacing={2}>
          <TextField
            label="message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading} 
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
            disabled={loading || !message.trim()} 
          >
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
        {error && <Box color="red">{error}</Box>}
      </Stack>
    </Box>
  );
}


