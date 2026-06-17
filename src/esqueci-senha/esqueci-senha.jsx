import './esqueci-senha.css'
import '../fazer-login/login.css'
import { useState } from 'react'
import { Link } from 'react-router'
import { auth } from '../firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import Logo from '../assets/Logo.png'
import { CircleCheck } from 'lucide-react';

function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setEnviado(true)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setErro('Nenhuma conta encontrada com este e-mail.')
      } else if (err.code === 'auth/invalid-email') {
        setErro('E-mail inválido. Verifique e tente novamente.')
      } else {
        setErro('Erro ao enviar o e-mail. Tente novamente.')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className='login-container'>
      <div className='login-esquerda'>
        <img src={Logo} alt="Logo" className='login-logo' />
      </div>

      <div className='login-direita'>
        <div className='login-card'>

          {enviado ? (
            // Tela de sucesso após enviar o e-mail
            <div className='reset-sucesso'>
              <span className='reset-icone'><CircleCheck size={100}/> </span>
              <h2>E-mail enviado!</h2>
              <p>Verifique sua caixa de entrada em <strong>{email}</strong> e siga as instruções para redefinir sua senha.</p>
              <p className='reset-obs'>Não recebeu? Cheque a pasta de spam.</p>
              <Link to="/login" className='cadastro-link'>Voltar para o login</Link>
            </div>
          ) : (
            // Formulário de recuperação
            <>
              <h2>Esqueceu sua senha?</h2>
              <p className='reset-descricao'>
                Digite seu e-mail cadastrado e enviaremos um link para você redefinir sua senha.
              </p>

              <form onSubmit={handleReset}>
                <label>E-mail:</label>
                <input
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {erro && <p className='erro'>{erro}</p>}

                <div className='botao-entrar'>
                  <button type="submit" disabled={carregando}>
                    {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </div>
              </form>

              <Link to="/login" className='esqueci-senha' style={{ textAlign: 'center', display: 'block', marginTop: '12px' }}>
                Voltar para o login
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default EsqueciSenha