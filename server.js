const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// بيانات Supabase الخاصة بك
const supabaseUrl = 'https://rlvaiojoanvbieiwwoxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdmFpb2pvYW52YmllaXd3b3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjkwNjQsImV4cCI6MjA4MzMwNTA2NH0.xyTzI9w3uzz1kra0FUOjqakLcYNRrLloZZzleCoRbK4';

const supabase = createClient(supabaseUrl, supabaseKey);

// صفحة للتجربة
app.get('/', (req, res) => {
  res.json({ message: 'Backend شغال تمام!' });
});

// تسجيل دخول
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      user: data.user,
      token: data.session.access_token
    });
    
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server شغال على بورت ${PORT}`);
});