import { useState, type FormEvent } from 'react'
import { Atom, Eye, EyeOff, X } from 'lucide-react'
import { signIn, signUp, type AuthUser } from '../lib/auth'

type AuthModalProps = {
  onClose: () => void
  onAuthenticated: (user: AuthUser) => void
}

export default function AuthModal({ onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = mode === 'login'
        ? await signIn(email, password)
        : await signUp(name, email, password)
      onAuthenticated(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close sign in"><X size={18} /></button>
        <div className="auth-mark"><Atom size={23} /></div>
        <div className="auth-eyebrow">JEE ARCHIVE ACCOUNT</div>
        <h2 id="auth-title">{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h2>
        <p className="auth-description">
          {mode === 'login'
            ? 'Sign in to prepare for your next attempt.'
            : 'Create an account to keep your practice history together.'}
        </p>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label>
              <span>FULL NAME</span>
              <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={60} required placeholder="Your name" />
            </label>
          )}
          <label>
            <span>EMAIL ADDRESS</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required placeholder="you@example.com" />
          </label>
          <label>
            <span>PASSWORD</span>
            <div className="auth-password-field">
              <input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === 'register' ? 8 : 1} maxLength={72} required placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already registered?'}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </div>
        <div className="auth-security">Your password is securely hashed. Sessions use an HttpOnly cookie.</div>
      </section>
    </div>
  )
}
