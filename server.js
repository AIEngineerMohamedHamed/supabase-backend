const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// بيانات Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rlvaiojoanvbieiwwoxu.supabase.co',
  process.env.SUPABASE_KEY || 'ضع_المفتاح_هنا'
);

// صفحة للتجربة
app.get('/', (req, res) => {
  res.json({ message: 'Backend شغال تمام!' });
});

// ✅ تسجيل دخول
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
      message: 'تم تسجيل الدخول بنجاح',
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

// 🆕 تسجيل مستخدم جديد (Register)
app.post('/api/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  
  // التحقق من البيانات
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'البريد الإلكتروني وكلمة المرور مطلوبان' 
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' 
    });
  }
  
  try {
    // إنشاء مستخدم جديد
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: full_name || ''
        }
      }
    });
    
    if (error) throw error;
    
    // لو Supabase بيطلب تأكيد البريد
    if (data.user && !data.session) {
      return res.json({ 
        success: true,
        message: 'تم التسجيل! يرجى تأكيد بريدك الإلكتروني',
        user: data.user,
        needsEmailConfirmation: true
      });
    }
    
    // لو التسجيل نجح مباشرة
    res.json({ 
      success: true,
      message: 'تم التسجيل بنجاح!',
      user: data.user,
      token: data.session?.access_token,
      needsEmailConfirmation: false
    });
    
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 🔍 التحقق من البريد الإلكتروني (اختياري)
app.post('/api/check-email', async (req, res) => {
  const { email } = req.body;
  
  try {
    // محاولة تسجيل الدخول بباسورد غلط عشان نشوف لو الإيميل موجود
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'fake-password-to-check'
    });
    
    if (error && error.message.includes('Invalid')) {
      return res.json({ 
        success: true,
        exists: true,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }
    
    res.json({ 
      success: true,
      exists: false 
    });
    
  } catch (error) {
    res.json({ 
      success: true,
      exists: false 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server شغال على بورت ${PORT}`);
});
