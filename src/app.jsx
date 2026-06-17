import { Routes, Route, useLocation } from 'react-router' // Importamos o useLocation
import Inicio from './inicio/inicio'
import Competitivo from './competitivo/competitivo'
import Login from './fazer-login/login'
import Cadastro from './cadastro/cadastro'
import PageTransition from './transicao-paginas/transicao'
import EsqueciSenha from './esqueci-senha/esqueci-senha'
import Atualizacoes from './atualizacoes/atualizacoes'

function App() {
  const location = useLocation(); // Captura a rota atual (ex: "/", "/login")

  return (
    <PageTransition key={location.pathname}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/competitivo" element={<Competitivo />} />
        <Route path='/login' element={<Login />} />
        <Route path='/cadastro' element={<Cadastro />} />
        <Route path='/esqueci-senha' element={<EsqueciSenha />} />
        <Route path='/atualizacoes' element={<Atualizacoes />} />
      </Routes>
    </PageTransition>
  );
}

export default App;