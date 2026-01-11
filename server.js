const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

/* ================== Supabase ================== */
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rlvaiojoanvbieiwwoxu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'PUT_YOUR_ANON_KEY_HERE'
);

/* ================== Rate Limit ================== */
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: {
    success: false,
    error: 'انتظر دقيقة قبل إعادة إرسال الكود'
  }
});

/* ================== Test ================== */
app.get('/', (req, res) => {
  res.json({ message: '✅ Backend OTP شغال تمام' });
});

/* =====================================================
   1️⃣ Send OTP (Email)
===================================================== */
app.post('/api/send-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'البريد الإلكتروني مطلوب'
    });
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) throw error;

    res.json({
      success: true,
      message: '📩 تم إرسال كود التحقق إلى البريد الإلكتروني'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/* =====================================================
   2️⃣ Verify OTP
===================================================== */
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: 'الإيميل وكود التحقق مطلوبين'
    });
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    if (error) throw error;

    if (!data.user.email_confirmed_at) {
      return res.status(401).json({
        success: false,
        error: 'يرجى تأكيد البريد الإلكتروني'
      });
    }

    res.json({
      success: true,
      message: '✅ تم التحقق بنجاح',
      user: {
        id: data.user.id,
        email: data.user.email
      },
      token: data.session.access_token
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: '❌ كود التحقق غير صحيح أو منتهي'
    });
  }
});

/* =====================================================
   3️⃣ Protected Route (JWT)
===================================================== */
app.get('/api/profile', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;

    res.json({
      success: true,
      user: data.user
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token غير صالح'
    });
  }
});

/* ================== Server ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
