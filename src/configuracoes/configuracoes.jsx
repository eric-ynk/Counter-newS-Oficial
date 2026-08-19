import './configuracoes.css'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { auth, db } from '../firebase'
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth'
import { ref, get, update } from 'firebase/database'
import { useAuth } from '../Authcontext'
import client from '../sanity'
import { User, Lock, Star, Bell, Palette, Shield, LogOut, Check } from 'lucide-react'

// ─── Config padrão (preferências) ────────────────────────────────────────────
const CONFIG_PADRAO = {
  jogos: { cs2: true, valorant: false, lol: false, dota2: false, r6: false },
  regiao: 'todas',
  idioma: 'pt-BR',
  timesFavoritos: [],
  semSpoiler: false,
  notif: { newsletter: true, ultimaHora: true, partidas: true, atualizacoes: false, comunidade: true },
  aparencia: { reduzirAnimacoes: false, densidade: 'confortavel' },
  privacidade: { perfilPublico: true, statusOnline: true },
}

const JOGOS = [
  { id: 'cs2', nome: 'Counter-Strike 2' },
  { id: 'valorant', nome: 'Valorant' },
  { id: 'lol', nome: 'League of Legends' },
  { id: 'dota2', nome: 'Dota 2' },
  { id: 'r6', nome: 'Rainbow Six' },
]

const SECOES = [
  { id: 'perfil', label: 'Perfil', Icon: User },
  { id: 'conta', label: 'Conta e segurança', Icon: Lock },
  { id: 'preferencias', label: 'Preferências', Icon: Star },
  { id: 'notificacoes', label: 'Notificações', Icon: Bell },
  { id: 'aparencia', label: 'Aparência', Icon: Palette },
  { id: 'privacidade', label: 'Privacidade', Icon: Shield },
]

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      className={`cfg-toggle ${checked ? 'cfg-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="cfg-toggle-bola" />
    </button>
  )
}

function LinhaOpcao({ titulo, descricao, children }) {
  return (
    <div className="cfg-linha">
      <div className="cfg-linha-texto">
        <span className="cfg-linha-titulo">{titulo}</span>
        {descricao && <span className="cfg-linha-desc">{descricao}</span>}
      </div>
      <div className="cfg-linha-controle">{children}</div>
    </div>
  )
}

function Feedback({ msg }) {
  if (!msg) return null
  return <p className={`cfg-feedback cfg-feedback--${msg.tipo}`}>{msg.texto}</p>
}

function getInicial(user) {
  if (user?.displayName) return user.displayName.charAt(0).toUpperCase()
  if (user?.email) return user.email.charAt(0).toUpperCase()
  return '?'
}

// ─── Página ───────────────────────────────────────────────────────────────────
function Configuracoes() {
  const { user, loadingAuth, logout } = useAuth()
  const navigate = useNavigate()

  const [secao, setSecao] = useState('perfil')

  // Perfil
  const [nome, setNome] = useState('')
  const [fotoURL, setFotoURL] = useState('')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [msgPerfil, setMsgPerfil] = useState(null)

  // Conta
  const [novoEmail, setNovoEmail] = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [msgConta, setMsgConta] = useState(null)

  // Preferências
  const [config, setConfig] = useState(CONFIG_PADRAO)
  const [times, setTimes] = useState([])
  const [salvoFlag, setSalvoFlag] = useState(false)
  const carregouRef = useRef(false)

  const provedor = user?.providerData?.[0]?.providerId || 'password'
  const ehSenha = provedor === 'password'

  // Redireciona se deslogado
  useEffect(() => {
    if (!loadingAuth && !user) navigate('/login')
  }, [loadingAuth, user, navigate])

  // Preenche dados do perfil
  useEffect(() => {
    if (user) {
      setNome(user.displayName || '')
      setFotoURL(user.photoURL || '')
    }
  }, [user])

  // Carrega preferências (DB → fallback localStorage)
  useEffect(() => {
    if (!user) return
    let cancelado = false
    const local = (() => {
      try { return JSON.parse(localStorage.getItem('cn-config') || 'null') } catch { return null }
    })()
    if (local) setConfig((c) => ({ ...c, ...local }))

    get(ref(db, `users/${user.uid}/config`))
      .then((snap) => {
        if (cancelado) return
        if (snap.exists()) {
          setConfig((c) => ({ ...CONFIG_PADRAO, ...c, ...snap.val() }))
        }
        carregouRef.current = true
      })
      .catch(() => { carregouRef.current = true })

    return () => { cancelado = true }
  }, [user])

  // Times do Sanity (para favoritos)
  useEffect(() => {
    client
      .fetch('*[_type=="equipe"]|order(posicao asc){nome,"slug":slug.current}')
      .then((data) => setTimes(data || []))
      .catch(() => setTimes([]))
  }, [])

  // Persiste preferências (DB + localStorage) ao mudar
  useEffect(() => {
    if (!user || !carregouRef.current) return
    localStorage.setItem('cn-config', JSON.stringify(config))
    document.documentElement.classList.toggle('cn-no-anim', !!config.aparencia.reduzirAnimacoes)
    update(ref(db, `users/${user.uid}/config`), config).catch(() => {})
    setSalvoFlag(true)
    const t = setTimeout(() => setSalvoFlag(false), 1500)
    return () => clearTimeout(t)
  }, [config, user])

  // ─── Handlers de perfil ───────────────────────────────────────────────────
  async function salvarPerfil(e) {
    e.preventDefault()
    setMsgPerfil(null)
    setSalvandoPerfil(true)
    try {
      await updateProfile(auth.currentUser, {
        displayName: nome.trim(),
        photoURL: fotoURL.trim(),
      })
      setMsgPerfil({ tipo: 'ok', texto: 'Perfil atualizado com sucesso!' })
    } catch {
      setMsgPerfil({ tipo: 'erro', texto: 'Não foi possível salvar o perfil.' })
    } finally {
      setSalvandoPerfil(false)
    }
  }

  // ─── Handlers de conta ────────────────────────────────────────────────────
  async function reautenticar() {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, senhaAtual)
    await reauthenticateWithCredential(auth.currentUser, cred)
  }

  async function alterarEmail(e) {
    e.preventDefault()
    setMsgConta(null)
    if (!novoEmail.trim()) return
    try {
      await reautenticar()
      await updateEmail(auth.currentUser, novoEmail.trim())
      setMsgConta({ tipo: 'ok', texto: 'E-mail alterado! Talvez seja preciso entrar de novo.' })
      setNovoEmail('')
      setSenhaAtual('')
    } catch (err) {
      setMsgConta({ tipo: 'erro', texto: traduzErro(err) })
    }
  }

  async function alterarSenha(e) {
    e.preventDefault()
    setMsgConta(null)
    if (novaSenha !== confirmarSenha) {
      setMsgConta({ tipo: 'erro', texto: 'As novas senhas não coincidem.' })
      return
    }
    try {
      await reautenticar()
      await updatePassword(auth.currentUser, novaSenha)
      setMsgConta({ tipo: 'ok', texto: 'Senha alterada com sucesso!' })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (err) {
      setMsgConta({ tipo: 'erro', texto: traduzErro(err) })
    }
  }

  async function excluirConta() {
    const ok = window.confirm(
      'Tem certeza que deseja excluir sua conta? Esta ação é permanente e não pode ser desfeita.'
    )
    if (!ok) return
    try {
      if (ehSenha) await reautenticar()
      await deleteUser(auth.currentUser)
      navigate('/')
    } catch (err) {
      setMsgConta({ tipo: 'erro', texto: traduzErro(err) })
    }
  }

  function traduzErro(err) {
    switch (err?.code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Senha atual incorreta.'
      case 'auth/requires-recent-login':
        return 'Por segurança, saia e entre novamente antes de alterar isto.'
      case 'auth/email-already-in-use':
        return 'Este e-mail já está em uso.'
      case 'auth/weak-password':
        return 'A nova senha deve ter pelo menos 6 caracteres.'
      case 'auth/invalid-email':
        return 'E-mail inválido.'
      default:
        return 'Não foi possível concluir. Tente novamente.'
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  // Helpers de atualização de config
  const setJogo = (id, v) => setConfig((c) => ({ ...c, jogos: { ...c.jogos, [id]: v } }))
  const setNotif = (id, v) => setConfig((c) => ({ ...c, notif: { ...c.notif, [id]: v } }))
  const setApar = (id, v) => setConfig((c) => ({ ...c, aparencia: { ...c.aparencia, [id]: v } }))
  const setPriv = (id, v) => setConfig((c) => ({ ...c, privacidade: { ...c.privacidade, [id]: v } }))
  const toggleTime = (slug) =>
    setConfig((c) => ({
      ...c,
      timesFavoritos: c.timesFavoritos.includes(slug)
        ? c.timesFavoritos.filter((s) => s !== slug)
        : [...c.timesFavoritos, slug],
    }))

  if (loadingAuth || !user) {
    return <div className="cfg-page"><p className="cfg-carregando">Carregando…</p></div>
  }

  return (
    <div className="cfg-page">
      <div className="cfg-shell">
        <header className="cfg-cabecalho">
          <h1>Configurações</h1>
          <p>Gerencie seu perfil, conta e preferências do Counter-News.</p>
        </header>

        <div className="cfg-layout">
          {/* ── Navegação lateral ── */}
          <nav className="cfg-nav" aria-label="Seções de configurações">
            {SECOES.map((s) => (
              <button
                key={s.id}
                className={`cfg-nav-item ${secao === s.id ? 'cfg-nav-item--ativo' : ''}`}
                onClick={() => setSecao(s.id)}
              >
                <s.Icon size={18} className="cfg-nav-icon" aria-hidden="true" />
                {s.label}
              </button>
            ))}
            <button className="cfg-nav-item cfg-nav-item--sair" onClick={handleLogout}>
              <LogOut size={18} className="cfg-nav-icon" aria-hidden="true" />
              Sair da conta
            </button>
          </nav>

          {/* ── Conteúdo ── */}
          <div className="cfg-conteudo">
            {/* PERFIL */}
            {secao === 'perfil' && (
              <section className="cfg-card">
                <h2 className="cfg-card-titulo">Perfil</h2>
                <p className="cfg-card-sub">Como você aparece no site e na comunidade.</p>

                <div className="cfg-avatar-bloco">
                  {fotoURL ? (
                    <img src={fotoURL} alt="Foto de perfil" className="cfg-avatar" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    <span className="cfg-avatar cfg-avatar--inicial">{getInicial(user)}</span>
                  )}
                  <div className="cfg-avatar-info">
                    <span className="cfg-avatar-nome">{user.displayName || 'Sem nome'}</span>
                    <span className="cfg-avatar-email">{user.email}</span>
                  </div>
                </div>

                <form className="cfg-form" onSubmit={salvarPerfil}>
                  <label className="cfg-label">Nome de exibição</label>
                  <input className="cfg-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />

                  <label className="cfg-label">URL da foto de perfil</label>
                  <input className="cfg-input" value={fotoURL} onChange={(e) => setFotoURL(e.target.value)} placeholder="https://..." />
                  <span className="cfg-dica">Cole o link de uma imagem para usar como avatar.</span>

                  <Feedback msg={msgPerfil} />
                  <button className="cfg-btn" type="submit" disabled={salvandoPerfil}>
                    {salvandoPerfil ? 'Salvando…' : 'Salvar perfil'}
                  </button>
                </form>
              </section>
            )}

            {/* CONTA */}
            {secao === 'conta' && (
              <section className="cfg-card">
                <h2 className="cfg-card-titulo">Conta e segurança</h2>
                <p className="cfg-card-sub">
                  {ehSenha
                    ? 'Altere seu e-mail ou senha. Pedimos sua senha atual por segurança.'
                    : `Você entrou com ${provedor.replace('.com', '')}. E-mail e senha são gerenciados por lá.`}
                </p>

                {ehSenha && (
                  <>
                    <form className="cfg-form" onSubmit={alterarEmail}>
                      <label className="cfg-label">Novo e-mail</label>
                      <input className="cfg-input" type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder={user.email} />
                      <label className="cfg-label">Senha atual</label>
                      <input className="cfg-input" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="Confirme com sua senha" />
                      <button className="cfg-btn cfg-btn--secundario" type="submit">Alterar e-mail</button>
                    </form>

                    <div className="cfg-separador" />

                    <form className="cfg-form" onSubmit={alterarSenha}>
                      <label className="cfg-label">Nova senha</label>
                      <input className="cfg-input" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
                      <label className="cfg-label">Confirmar nova senha</label>
                      <input className="cfg-input" type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha" />
                      <span className="cfg-dica">Você também precisará informar a senha atual no campo acima.</span>
                      <button className="cfg-btn cfg-btn--secundario" type="submit">Alterar senha</button>
                    </form>
                  </>
                )}

                <Feedback msg={msgConta} />

                <div className="cfg-separador" />
                <div className="cfg-perigo">
                  <div>
                    <span className="cfg-linha-titulo">Excluir conta</span>
                    <span className="cfg-linha-desc">Remove permanentemente sua conta e dados.</span>
                  </div>
                  <button className="cfg-btn cfg-btn--perigo" onClick={excluirConta}>Excluir conta</button>
                </div>
              </section>
            )}

            {/* PREFERÊNCIAS */}
            {secao === 'preferencias' && (
              <section className="cfg-card">
                <h2 className="cfg-card-titulo">Preferências de conteúdo</h2>
                <p className="cfg-card-sub">Personalize o que você vê no Counter-News.</p>

                <h3 className="cfg-grupo-titulo">Jogos que você acompanha (por enquanto, apenas o Counter-Strike está disponível)</h3>
                <div className="cfg-chips">
                  {JOGOS.map((j) => (
                    <button
                      key={j.id}
                      className={`cfg-chip ${config.jogos[j.id] ? 'cfg-chip--on' : ''}`}
                      onClick={() => setJogo(j.id, !config.jogos[j.id])}
                    >
                      {j.nome}
                    </button>
                  ))}
                </div>

                <h3 className="cfg-grupo-titulo">Times favoritos</h3>
                {times.length === 0 ? (
                  <p className="cfg-dica">Nenhum time disponível no momento.</p>
                ) : (
                  <div className="cfg-chips">
                    {times.map((t) => {
                      const fav = config.timesFavoritos.includes(t.slug)
                      return (
                        <button
                          key={t.slug}
                          className={`cfg-chip ${fav ? 'cfg-chip--on' : ''}`}
                          onClick={() => toggleTime(t.slug)}
                        >
                          <Star size={15} fill={fav ? 'currentColor' : 'none'} aria-hidden="true" />
                          {t.nome}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="cfg-separador" />

                <LinhaOpcao titulo="Região preferida" descricao="Prioriza notícias e ranking dessa região.">
                  <select className="cfg-select" value={config.regiao} onChange={(e) => setConfig((c) => ({ ...c, regiao: e.target.value }))}>
                    <option value="todas">Todas</option>
                    <option value="EURO">Europa</option>
                    <option value="AMÉRICAS">Américas</option>
                    <option value="ÁSIA">Ásia</option>
                  </select>
                </LinhaOpcao>

                <LinhaOpcao titulo="Idioma" descricao="Idioma de exibição do conteúdo.">
                  <select className="cfg-select" value={config.idioma} onChange={(e) => setConfig((c) => ({ ...c, idioma: e.target.value }))}>
                    <option value="pt-BR">Português (BR)</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </LinhaOpcao>

                <LinhaOpcao titulo="Modo sem spoiler" descricao="Oculta placares e resultados de partidas até você clicar.">
                  <Toggle checked={config.semSpoiler} onChange={(v) => setConfig((c) => ({ ...c, semSpoiler: v }))} />
                </LinhaOpcao>
              </section>
            )}

            {/* NOTIFICAÇÕES */}
            {secao === 'notificacoes' && (
              <section className="cfg-card">
                <h2 className="cfg-card-titulo">Notificações</h2>
                <p className="cfg-card-sub">Escolha o que quer receber.</p>

                <LinhaOpcao titulo="Newsletter por e-mail" descricao="Resumo semanal das principais notícias.">
                  <Toggle checked={config.notif.newsletter} onChange={(v) => setNotif('newsletter', v)} />
                </LinhaOpcao>
                <LinhaOpcao titulo="Últimas horas" descricao="Avisos de notícias de última hora.">
                  <Toggle checked={config.notif.ultimaHora} onChange={(v) => setNotif('ultimaHora', v)} />
                </LinhaOpcao>
                <LinhaOpcao titulo="Partidas dos favoritos" descricao="Quando seus times favoritos forem jogar.">
                  <Toggle checked={config.notif.partidas} onChange={(v) => setNotif('partidas', v)} />
                </LinhaOpcao>
                <LinhaOpcao titulo="Atualizações dos jogos" descricao="Patches e novidades dos jogos que você acompanha.">
                  <Toggle checked={config.notif.atualizacoes} onChange={(v) => setNotif('atualizacoes', v)} />
                </LinhaOpcao>
                <LinhaOpcao titulo="Respostas na comunidade" descricao="Quando alguém responder você no chat.">
                  <Toggle checked={config.notif.comunidade} onChange={(v) => setNotif('comunidade', v)} />
                </LinhaOpcao>
              </section>
            )}

            {/* APARÊNCIA */}
            {secao === 'aparencia' && (
              <section className="cfg-card">
                <h2 className="cfg-card-titulo">Aparência</h2>
                <p className="cfg-card-sub">Ajuste a experiência visual do site.</p>

                <LinhaOpcao titulo="Tema" descricao="O tema escuro é o padrão do Counter-News.">
                  <select className="cfg-select" value="escuro" disabled>
                    <option value="escuro">Escuro</option>
                  </select>
                </LinhaOpcao>
                <LinhaOpcao titulo="Densidade" descricao="Espaçamento entre os elementos.">
                  <select className="cfg-select" value={config.aparencia.densidade} onChange={(e) => setApar('densidade', e.target.value)}>
                    <option value="confortavel">Confortável</option>
                    <option value="compacto">Compacto</option>
                  </select>
                </LinhaOpcao>
                <LinhaOpcao titulo="Reduzir animações" descricao="Diminui transições e efeitos de movimento.">
                  <Toggle checked={config.aparencia.reduzirAnimacoes} onChange={(v) => setApar('reduzirAnimacoes', v)} />
                </LinhaOpcao>
              </section>
            )}

            {/* PRIVACIDADE */}
            {secao === 'privacidade' && (
              <section className="cfg-card">
                <h2 className="cfg-card-titulo">Privacidade</h2>
                <p className="cfg-card-sub">Controle como você aparece para os outros.</p>

                <LinhaOpcao titulo="Perfil público na comunidade" descricao="Permite que outros vejam seu nome e avatar no chat.">
                  <Toggle checked={config.privacidade.perfilPublico} onChange={(v) => setPriv('perfilPublico', v)} />
                </LinhaOpcao>
                <LinhaOpcao titulo="Mostrar status online" descricao="Exibe quando você está online na comunidade.">
                  <Toggle checked={config.privacidade.statusOnline} onChange={(v) => setPriv('statusOnline', v)} />
                </LinhaOpcao>
              </section>
            )}

            {salvoFlag && (
              <span className="cfg-salvo"><Check size={15} aria-hidden="true" /> Preferências salvas</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Configuracoes
