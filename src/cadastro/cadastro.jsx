import './cadastro.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import Logo from '../assets/Logo.png'

function Cadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  const handleCadastro = async (e) => {
    e.preventDefault()
    setErro('')

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, senha)
      if (nome.trim()) {
        await updateProfile(user, { displayName: nome.trim() })
      }
      navigate('/')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está em uso.')
      } else if (err.code === 'auth/weak-password') {
        setErro('A senha deve ter pelo menos 6 caracteres.')
      } else {
        setErro('Erro ao cadastrar. Tente novamente.')
      }
    }
  }

  const handleGoogle = async () => {
    setErro('')
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      navigate('/')
    } catch (err) {
      setErro('Não foi possível cadastrar com o Google.')
    }
  }

  const handleApple = () => {
    setErro('Cadastro com Apple estará disponível em breve.')
  }

  const OlhoIcone = ({ aberto }) =>
    aberto ? (
      <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' />
        <line x1='1' y1='1' x2='23' y2='23' />
      </svg>
    ) : (
      <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
        <circle cx='12' cy='12' r='3' />
      </svg>
    )

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
            <h1 className='auth-titulo'>Crie sua conta</h1>
            <p className='auth-sub'>Cadastre-se e acompanhe o cenário competitivo</p>

            <form className='auth-form' onSubmit={handleCadastro}>
              <label className='auth-label'>Nome completo</label>
              <div className='auth-field'>
                <input
                  type='text'
                  placeholder='Digite seu nome'
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <label className='auth-label'>E-mail</label>
              <div className='auth-field'>
                <input
                  type='email'
                  placeholder='Digite seu e-mail'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <label className='auth-label'>Senha</label>
              <div className='auth-field'>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder='Crie uma senha'
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type='button'
                  className='auth-eye'
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <OlhoIcone aberto={mostrarSenha} />
                </button>
              </div>

              <label className='auth-label'>Confirmar senha</label>
              <div className='auth-field'>
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  placeholder='Confirme sua senha'
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
                <button
                  type='button'
                  className='auth-eye'
                  onClick={() => setMostrarConfirmar((v) => !v)}
                  aria-label={mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <OlhoIcone aberto={mostrarConfirmar} />
                </button>
              </div>

              {erro && <p className='auth-erro'>{erro}</p>}

              <button type='submit' className='auth-submit'>Criar conta</button>
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
            <span>Já tem conta? <Link to='/login'>Entrar</Link></span>
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

export default Cadastro
