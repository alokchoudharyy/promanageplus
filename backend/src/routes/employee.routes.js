const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ✅ Create Employee with Password
router.post('/create-employee', authenticate, async (req, res) => {
  try {
    const { email, password, full_name, mobile } = req.body;
    const manager_id = req.user.id;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'employee',
        manager_id,
        mobile: mobile || ''
      }
    });

    if (authError) throw authError;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        mobile: mobile || '',
        role: 'employee',
        manager_id
      });

    if (profileError) throw profileError;

    res.status(201).json({ 
      success: true,
      user: authData.user, 
      message: 'Employee created successfully' 
    });
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Send Invite Link
router.post('/invite-employee', authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    const manager_id = req.user.id;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate unique token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Save invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('invites')
      .insert({
        email,
        manager_id,
        token,
        expires_at
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    const inviteLink = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;

    res.json({ 
      success: true,
      inviteLink,
      message: 'Invitation created successfully' 
    });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
