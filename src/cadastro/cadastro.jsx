import './cadastro.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword } from "firebase/auth";
import Logo from '../assets/Logo menor.png'

function Cadastro() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
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
      await createUserWithEmailAndPassword(auth, email, senha)
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

  return (
    <div className='cadastro-container'>
      <div className='cadastro-esquerda'>
        <img src={Logo} alt="Logo" className='cadastro-logo' />
      </div>

      <div className='cadastro-direita'>
        <div className='cadastro-card'>
          <h2>Crie sua conta!</h2>

          <form onSubmit={handleCadastro}>
            <label>E-mail:</label>
            <input
              type="email"
              placeholder="Digite seu e-mail"
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

            <label>Confirmar senha</label>
            <input
              type="password"
              placeholder="Confirme sua senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />

            {erro && <p className='erro'>{erro}</p>}

            <button type="submit">Cadastrar</button>
          </form>

          <p className='login-texto'>Já tem uma conta?</p>
          <Link to="/login" className='login-link'>Faça login!</Link>
        </div>
      </div>
    </div>
  )
}

export default Cadastro