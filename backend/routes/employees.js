const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// ✅ STEP 4: SECURITY FIX - Middleware to verify manager auth
const verifyManager = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.error('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      console.error('❌ Token verification failed:', error?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // ✅ CRITICAL: Check role is 'manager'
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, id, full_name')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('❌ Profile fetch failed:', profileError?.message);
      return res.status(403).json({ error: 'Profile not found' });
    }

    if (profile.role !== 'manager') {
      console.error('❌ Access denied - User role:', profile.role, 'User:', user.email);
      return res.status(403).json({ error: 'Manager access only' });
    }

    console.log('✅ Manager verified:', profile.full_name, user.email);
    req.user = user;
    req.managerId = user.id;
    next();
  } catch (err) {
    console.error('❌ Verify error:', err);
    res.status(500).json({ error: 'Auth failed' });
  }
};

// ✅ POST /api/employees/create-employee - Create or Invite Employee
router.post('/create-employee', verifyManager, async (req, res) => {
  try {
    const { email, full_name, mobile, password } = req.body;
    const managerId = req.managerId;

    console.log('📥 Create employee request - Email:', email, 'Has password:', !!password);

    // Validation
    if (!email || !full_name) {
      return res.status(400).json({ error: 'Email and full name required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email, 'Role:', existingUser.role);
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    let result;
    
    if (password && password.trim().length >= 8) {
      // ═══════════════════════════════════════════════════════════
      // OPTION 1: Direct create with password (manual account)
      // ═══════════════════════════════════════════════════════════
      console.log('🔐 Creating employee with password...');
      
      const { data, error: signupError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password.trim(),
        email_confirm: true,  // Auto confirm for manual creation
        user_metadata: {
          full_name: full_name.trim(),
          mobile: mobile?.trim() || null,
          role: 'employee',  // ✅ Trigger will read this
          manager_id: managerId
        }
      });

      if (signupError) {
        console.error('❌ Signup error:', signupError);
        throw signupError;
      }

      console.log('✅ User created in auth.users:', data.user.id);

      // Insert profile (trigger should do this, but double-check)
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!existingProfile) {
        console.log('⚠️ Trigger missed profile, inserting manually...');
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: data.user.id,
            email: normalizedEmail,
            full_name: full_name.trim(),
            mobile: mobile?.trim() || null,
            role: 'employee',
            manager_id: managerId,
            notification_preferences: {
              push: true,
              email: true,
              dailyDigest: true,
              deadlineReminders: true,
              emailNotifications: true
            }
          });

        if (profileError) {
          console.error('❌ Profile insert error:', profileError);
          throw profileError;
        }
        console.log('✅ Profile inserted manually');
      } else {
        console.log('✅ Profile exists (trigger created it)');
      }

      // Send welcome email (optional)
      try {
        await sendWelcomeEmail(normalizedEmail, full_name.trim(), password.trim());
      } catch (emailErr) {
        console.warn('⚠️ Welcome email failed (non-critical):', emailErr.message);
      }

      result = { 
        success: true,
        message: 'Employee created successfully with password', 
        userId: data.user.id,
        email: normalizedEmail
      };

    } else {
      // ═══════════════════════════════════════════════════════════
      // OPTION 2: Invite - Send magic link (no password)
      // ═══════════════════════════════════════════════════════════
      console.log('📧 Sending invite email (magic link)...');
      
      // ✅ STEP 5 FIX: Pass full metadata for trigger
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        normalizedEmail,
        {
          redirectTo: `${process.env.CLIENT_URL}/accept-invite`,
          data: {  // ✅ Metadata for trigger and AcceptInvite page
            full_name: full_name.trim(),
            mobile: mobile?.trim() || null,
            role: 'employee',  // ✅ CRITICAL: Trigger reads this
            manager_id: managerId  // ✅ Link to manager
          }
        }
      );

      if (inviteError) {
        console.error('❌ Invite error:', inviteError);
        
        // Fallback: Site URL config issue - Use password reset link instead
        if (inviteError.message.includes('site url') || inviteError.message.includes('redirect')) {
          console.warn('⚠️ Site URL issue, using password reset fallback...');
          
          // Create user first (unconfirmed)
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: normalizedEmail,
            email_confirm: false,  // User must confirm via link
            user_metadata: { 
              full_name: full_name.trim(), 
              mobile: mobile?.trim() || null, 
              role: 'employee', 
              manager_id: managerId 
            }
          });
          
          if (createError) {
            console.error('❌ Fallback user creation failed:', createError);
            throw createError;
          }

          // Generate reset link
          const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: normalizedEmail
          });
          
          if (resetError) {
            console.error('❌ Reset link generation failed:', resetError);
            throw resetError;
          }

          console.log('✅ Reset link generated (fallback)');
          result = { 
            success: true,
            message: 'Invite sent via password reset link. Employee must set password.', 
            isInvite: true,
            inviteLink: resetData.properties.action_link,  // Show to manager (optional)
            userId: newUser.user.id
          };
        } else {
          throw inviteError;
        }
      } else {
        console.log('✅ Invite email sent via Supabase');
        result = { 
          success: true,
          message: 'Invitation email sent! Employee will set password via magic link.', 
          isInvite: true,
          email: normalizedEmail
        };
      }
    }

    console.log('✅ Employee creation completed:', result.message);
    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Create/Invite error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/employees/verify/:token - Optional: Verify custom token (if not using magic link)
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ valid: false, error: 'JWT_SECRET not configured' });
    }
    
    // Decode JWT (if you generate custom tokens)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.email) {
      return res.status(400).json({ valid: false, error: 'Invalid token' });
    }
    
    console.log('✅ Token verified:', decoded.email);
    res.json({ valid: true, data: decoded });
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    res.status(400).json({ valid: false, error: 'Token expired or invalid' });
  }
});

// POST /api/employees/complete-invite - Mark invite accepted (optional logging)
router.post('/complete-invite', verifyManager, async (req, res) => {
  try {
    const { employeeId, full_name, mobile } = req.body;
    
    console.log('✅ Invite completed for employee:', employeeId);
    
    // Optional: Update profile if needed (AcceptInvite already does this)
    if (employeeId && (full_name || mobile)) {
      await supabaseAdmin
        .from('profiles')
        .update({
          full_name: full_name?.trim(),
          mobile: mobile?.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);
    }
    
    res.json({ success: true, message: 'Invite completed' });
  } catch (err) {
    console.error('❌ Complete invite error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// Helper: Send welcome email (nodemailer setup)
// ═══════════════════════════════════════════════════════════════
async function sendWelcomeEmail(email, fullName, password) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured, skipping welcome email');
    return;
  }

  try {
    // Setup transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"ProManage+" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to ProManage+ - Your Account is Ready',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #06b6d4;">Welcome to ProManage+, ${fullName}!</h1>
          <p>Your employee account has been created by your manager.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px;">${password}</code></p>
          </div>
          <p>Login at: <a href="${process.env.CLIENT_URL}/login?role=employee" style="color: #06b6d4;">${process.env.CLIENT_URL}/login?role=employee</a></p>
          <p style="color: #ef4444; font-size: 14px;">⚠️ Please change your password after first login in Settings.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">If you didn't expect this email, please contact your manager.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', email);
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
}

module.exports = router;
