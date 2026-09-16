import { Routes, Route, useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import Inicio from './inicio/inicio'
import Competitivo from './competitivo/competitivo'
import Login from './fazer-login/login'
import Cadastro from './cadastro/cadastro'
import PageTransition from './transicao-paginas/transicao'
import RouteSweep from './transicao-paginas/routesweep'
import EsqueciSenha from './esqueci-senha/esqueci-senha'
import Atualizacoes from './atualizacoes/atualizacoes'
import Ranking from './ranking/ranking'
import EquipeDetalhe from './ranking/equipeDetalhe'
import ComunidadeChat from './comunidade/comunidade'
import Configuracoes from './configuracoes/configuracoes'
import Guias from './guias/guias'
import Navbar from './cabecalho/cabecalho'
import Noticia from './noticia-completa/noticia'
import { useEffect } from 'react'

function App() {
  const location = useLocation()

  // Aplica preferências globais salvas (ex.: reduzir animações)
  useEffect(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem('cn-config') || '{}')
      document.documentElement.classList.toggle('cn-no-anim', !!cfg?.aparencia?.reduzirAnimacoes)
    } catch { /* ignora config inválida */ }
  }, [])

  return (
    <>
      <Navbar />
      <RouteSweep />
      <AnimatePresence mode='wait'>
        <PageTransition key={location.pathname}>
          <main>
            <Routes location={location}>
              <Route path="/" element={<Inicio />} />
              <Route path="/competitivo" element={<Competitivo />} />
              <Route path='/login' element={<Login />} />
              <Route path='/cadastro' element={<Cadastro />} />
              <Route path='/esqueci-senha' element={<EsqueciSenha />} />
              <Route path='/atualizacoes' element={<Atualizacoes />} />
              <Route path='/ranking' element={<Ranking />} />
              <Route path='/ranking/:slug' element={<EquipeDetalhe />} />
              <Route path='/comunidade' element={<ComunidadeChat/>}/>
              <Route path='/configuracoes' element={<Configuracoes/>}/>
              <Route path='/guias' element={<Guias/>}/>
              <Route path="/noticia/:slug" element={<Noticia />} />
            </Routes>
          </main>
        </PageTransition>
      </AnimatePresence>
    </>
  )
}

export default App