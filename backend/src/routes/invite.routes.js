const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: invite.email,
  password, 
  email_confirm: true,
  user_metadata: {
    full_name, 
    role: 'employee',
    manager_id: invite.manager_id,
    mobile: mobile || ''
  }
})
