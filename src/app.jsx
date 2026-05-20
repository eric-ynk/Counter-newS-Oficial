import { Routes, Route, useLocation } from 'react-router' // Importamos o useLocation
import Inicio from './inicio/inicio'
import Competitivo from './competitivo/competitivo'
import Login from './fazer-login/login'
import Cadastro from './cadastro/cadastro'
import PageTransition from './transicao-paginas/transicao'

function App() {
  const location = useLocation(); // Captura a rota atual (ex: "/", "/login")

  return (
    /* A mágica está aqui: mudar a key força o CSS a reiniciar a animação */
    <PageTransition key={location.pathname}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/competitivo" element={<Competitivo />} />
        <Route path='/login' element={<Login />} />
        <Route path='/cadastro' element={<Cadastro />} />
      </Routes>
    </PageTransition>
  );
}

export default App;