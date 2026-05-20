import './competitivo.css'
import '../global.css'
import { Link } from 'react-router';
import { useRef, useState, useEffect } from 'react';
import LogoHeader from '../assets/Logo menor.png'
import { useAuth } from '../Authcontext'

function Competitivo() {
    const { user, loadingAuth, logout } = useAuth();
    const [menuAberto, setMenuAberto] = useState(false);
    const menuRef = useRef(null);

    // Fecha o menu ao clicar fora
    useEffect(() => {
        function handleClickFora(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuAberto(false);
            }
        }
        document.addEventListener('mousedown', handleClickFora);
        return () => document.removeEventListener('mousedown', handleClickFora);
    }, []);

    function getInicial(user) {
        if (user.displayName) return user.displayName.charAt(0).toUpperCase();
        if (user.email) return user.email.charAt(0).toUpperCase();
        return '?';
    }

    async function handleLogout() {
        await logout();
        setMenuAberto(false);
    }

    return (
        <>
            <header className='cabecalho'>
                <Link to="/"><img src={LogoHeader} alt="Logo" id='logo' /></Link>

                <nav className='links'>
                    <ul>
                        <li className='lista-nav'><Link to="/">Notícias</Link></li>
                        <li className='lista-nav'><a href="#">Atualizações</a></li>
                        <li className='lista-nav'><a href="#">Ranking</a></li>
                        <li className='lista-nav'><a href="#">Comunidade</a></li>
                        <li className='lista-nav'><a href="#">Guias</a></li>
                    </ul>
                </nav>

                {!loadingAuth && (
                    user ? (
                        <div className='perfil-wrapper' ref={menuRef}>
                            <button
                                className='perfil-btn'
                                onClick={() => setMenuAberto(!menuAberto)}
                                aria-label="Menu do perfil"
                            >
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Foto de perfil" className='perfil-foto' />
                                ) : (
                                    <span className='perfil-inicial'>{getInicial(user)}</span>
                                )}
                            </button>

                            {menuAberto && (
                                <div className='perfil-menu'>
                                    <p className='perfil-email'>{user.displayName || user.email}</p>
                                    <hr className='perfil-divisor' />
                                    <Link to="/perfil" className='perfil-opcao' onClick={() => setMenuAberto(false)}>
                                        Meu perfil
                                    </Link>
                                    <button className='perfil-opcao perfil-sair' onClick={handleLogout}>
                                        Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" id='login' style={{ textDecoration: 'none' }}>Login</Link>
                    )
                )}
            </header>
        </>
    )
}

export default Competitivo