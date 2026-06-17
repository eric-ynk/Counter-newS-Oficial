import { Routes, Route, useLocation } from 'react-router'
import Inicio from './inicio/inicio'
import Competitivo from './competitivo/competitivo'
import Login from './fazer-login/login'
import Cadastro from './cadastro/cadastro'
import PageTransition from './transicao-paginas/transicao'
import EsqueciSenha from './esqueci-senha/esqueci-senha'
import Atualizacoes from './atualizacoes/atualizacoes'
import Ranking from './ranking/ranking'
import EquipeDetalhe from './ranking/equipeDetalhe'

function App() {
  const location = useLocation()

  return (
    <PageTransition key={location.pathname}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/competitivo" element={<Competitivo />} />
        <Route path='/login' element={<Login />} />
        <Route path='/cadastro' element={<Cadastro />} />
        <Route path='/esqueci-senha' element={<EsqueciSenha />} />
        <Route path='/atualizacoes' element={<Atualizacoes />} />
        <Route path='/ranking' element={<Ranking />} />
        <Route path='/ranking/:slug' element={<EquipeDetalhe />} />
      </Routes>
    </PageTransition>
  )
}

export default App