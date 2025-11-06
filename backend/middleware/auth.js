const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Loading auth middleware...');
console.log('📍 SUPABASE_URL:', process.env.SUPABASE_URL ? 'Loaded' : '❌ MISSING');
console.log('📍 SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Loaded (length: ' + process.env.SUPABASE_SERVICE_KEY.length + ')' : '❌ MISSING');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const authenticate = async (req, res, next) => {
  console.log('\n🔐 ============ AUTH MIDDLEWARE CALLED ============');
  console.log('📍 URL:', req.url);
  console.log('📍 Method:', req.method);
  
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔐 Auth header:', authHeader ? 'Present' : '❌ MISSING');
    
    if (!authHeader) {
      console.log('❌ No auth header - returning 401');
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid auth header format - returning 401');
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token extracted, length:', token.length);
    console.log('🎫 Token preview:', token.substring(0, 30) + '...');
    
    console.log('🔍 Verifying token with Supabase...');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      console.log('❌ Supabase error:', error.message);
      console.log('❌ Error details:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    if (!user) {
      console.log('❌ No user returned from Supabase');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('✅ User verified:', user.id);
    console.log('✅ User email:', user.email);
    req.user = user;
    console.log('✅ Proceeding to next middleware/route...\n');
    next();
  } catch (err) {
    console.error('❌ Auth middleware exception:', err);
    console.error('❌ Stack:', err.stack);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

console.log('✅ Auth middleware loaded successfully\n');

module.exports = { authenticate };
