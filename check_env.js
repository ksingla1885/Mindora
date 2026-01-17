require('dotenv').config();
console.log("Checking Supabase Environment Variables...");
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing");
console.log("Full env keys:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
