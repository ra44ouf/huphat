import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return Response.json({
      success: true,
      user: user ? { id: user.id, email: user.email } : null,
      userError: userError ? userError.message : null,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
