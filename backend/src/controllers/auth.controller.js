// src/controllers/auth.controller.js

export const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, avatar_url, ...others } = req.body
    const updates = {
      full_name,
      phone,
      avatar_url,
      updated_at: new Date(),
      ...others
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) throw error

    res.json({ user: data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
