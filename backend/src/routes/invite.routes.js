const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: invite.email,
  password, // from form
  email_confirm: true,
  user_metadata: {
    full_name, // from form
    role: 'employee',
    manager_id: invite.manager_id,
    mobile: mobile || ''
  }
})
