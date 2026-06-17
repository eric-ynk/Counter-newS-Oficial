import './login.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { auth } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import Logo from '../assets/Logo.png'

function FazerLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
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

  return (
    <div className='login-container'>
      <div className='login-esquerda'>
        <img src={Logo} alt="Logo" className='login-logo' />
      </div>

      <div className='login-direita'>
        <div className='login-card'>
          <h2>Faça Login ou cadastre-se!</h2>

          <form onSubmit={handleLogin}>
            <label>E-mail ou nome de usuário:</label>
            <input
              type="text"
              placeholder="Digite seu e-mail ou nome de usuário"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />

            {erro && <p className='erro'>{erro}</p>}

            <Link to="/esqueci-senha" className='esqueci-senha'>Esqueci minha senha</Link>
          <div className='botao-entrar'>
            <button type="submit">Entrar</button>
          </div>
          </form>

          <p className='cadastro-texto'>Ainda não tem cadastro?</p>
          <Link to="/cadastro" className='cadastro-link'>Clique aqui!</Link>
        </div>
      </div>
    </div>
  )
}

export default FazerLogin