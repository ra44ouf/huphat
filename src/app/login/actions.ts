'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Validate inputs
  if (!data.email || !data.password) {
    throw new Error('Email and password are required')
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Better error messages
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password')
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Please verify your email before logging in')
    }
    throw new Error(error.message || 'Authentication failed')
  }

  if (!authData.session) {
    throw new Error('No session created')
  }

  // Verify the session was set correctly
  const { data: verifyUser } = await supabase.auth.getUser()
  if (!verifyUser.user) {
    throw new Error('Session verification failed')
  }

  // Wait for cookies to be set
  await new Promise(resolve => setTimeout(resolve, 300))
  
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName') as string,
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/login?error=Could not sign up user')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}
