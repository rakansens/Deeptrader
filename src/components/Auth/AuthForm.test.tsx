import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthForm from './AuthForm'
import { supabase } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  },
}))

const mockSignInWithPassword = supabase.auth.signInWithPassword as jest.Mock

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays error message on login failure', async () => {
    const user = userEvent.setup()
    mockSignInWithPassword.mockResolvedValue({ error: new Error('fail') })

    render(<AuthForm />)
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(await screen.findByText('fail')).toBeInTheDocument()
  })

  it('shows generic message for unknown error', async () => {
    const user = userEvent.setup()
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'fail' } })

    render(<AuthForm />)
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(
      await screen.findByText('認証エラーが発生しました。')
    ).toBeInTheDocument()
  })
})
