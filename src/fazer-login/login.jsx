import './login.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import Logo from '../assets/Logo.png'

function FazerLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      await signInWithEmailAndPassword(auth, email, senha)
      navigate('/')
    } catch (err) {
      setErro('E-mail ou senha incorretos.')
    }
  }

  const handleGoogle = async () => {
    setErro('')
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      navigate('/')
    } catch (err) {
      setErro('Não foi possível entrar com o Google.')
    }
  }

  const handleApple = () => {
    setErro('Login com Apple estará disponível em breve.')
  }

  return (
    <div className='auth-page'>
      <div className='auth-shell'>
        {/* ── Formulário ── */}
        <div className='auth-form-side'>
          <Link to='/' className='auth-brand'>
            <img src={Logo} alt='Counter-News' />
            <span>Counter-News</span>
          </Link>

          <div className='auth-form-wrap'>
            <h1 className='auth-titulo'>Bem-vindo de volta</h1>
            <p className='auth-sub'>Entre para acompanhar o cenário competitivo</p>

            <form className='auth-form' onSubmit={handleLogin}>
              <label className='auth-label'>E-mail ou nome de usuário</label>
              <div className='auth-field'>
                <input
                  type='text'
                  placeholder='Digite seu e-mail'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <label className='auth-label'>Senha</label>
              <div className='auth-field'>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder='Digite sua senha'
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type='button'
                  className='auth-eye'
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? (
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                      <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' />
                      <line x1='1' y1='1' x2='23' y2='23' />
                    </svg>
                  ) : (
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
                      <circle cx='12' cy='12' r='3' />
                    </svg>
                  )}
                </button>
              </div>

              <Link to='/esqueci-senha' className='auth-link-inline'>Esqueci minha senha</Link>

              {erro && <p className='auth-erro'>{erro}</p>}

              <button type='submit' className='auth-submit'>Entrar</button>
            </form>

            <div className='auth-divisor'>ou continue com</div>

            <div className='auth-social'>
              <button type='button' className='auth-social-btn' onClick={handleApple}>
                <svg viewBox='0 0 24 24' fill='currentColor'><path d='M16.36 1.43c.05 1.06-.34 2.1-1.05 2.87-.72.78-1.84 1.36-2.92 1.28-.07-1.04.41-2.12 1.07-2.8.74-.78 1.99-1.34 2.9-1.35zM20 17.2c-.5 1.15-.74 1.66-1.38 2.68-.9 1.42-2.17 3.18-3.74 3.2-1.4.01-1.76-.91-3.65-.9-1.9.01-2.29.92-3.69.9-1.57-.02-2.77-1.62-3.67-3.03C1.66 16.07.93 11.4 2.5 8.95c.96-1.5 2.48-2.38 3.91-2.38 1.46 0 2.38.9 3.6.9 1.18 0 1.9-.9 3.6-.9 1.28 0 2.64.7 3.6 1.9-3.16 1.73-2.64 6.24.29 7.73z' /></svg>
                Apple
              </button>
              <button type='button' className='auth-social-btn' onClick={handleGoogle}>
                <svg viewBox='0 0 24 24'><path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z' /><path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z' /><path fill='#FBBC05' d='M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z' /><path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z' /></svg>
                Google
              </button>
            </div>
          </div>

          <div className='auth-footer'>
            <span>Não tem conta? <Link to='/cadastro'>Cadastre-se</Link></span>
            <Link to='/'>Termos &amp; Condições</Link>
          </div>
        </div>

        {/* ── Imagem (você coloca a sua) ── */}
        <div className='auth-media'>
          <img
            className='auth-media-img'
            src='/auth-image.jpg'
            alt=''
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <div className='auth-media-placeholder'>
            <strong>Espaço para a sua imagem</strong>
            <span>Coloque o arquivo em <code>public/auth-image.jpg</code></span>
          </div>
          <Link to='/' className='auth-media-close' aria-label='Fechar'>×</Link>
        </div>
      </div>
    </div>
  )
}

export default FazerLogin
