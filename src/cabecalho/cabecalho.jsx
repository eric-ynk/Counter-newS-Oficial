import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router";
import { signOut } from "firebase/auth";
import { auth } from "../firebase"; // ajuste o caminho conforme seu projeto
import { useAuth } from "../Authcontext"; // ajuste o caminho conforme seu projeto
import Logo from "../assets/Logo menor.png";
import { Settings } from "lucide-react";
import "./cabecalho.css";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO CENTRAL — edite apenas aqui para mudar links, logo e rotas
// ─────────────────────────────────────────────────────────────────────────────

const SITE_NAME = "Counter-newS";

const NAV_LINKS = [
  { label: "Início",       path: "/",               end: true  },
  { label: "Competitivo",  path: "/competitivo"                },
  { label: "Ranking",      path: "/ranking"                    },
  { label: "Atualizações", path: "/atualizacoes"               },
  { label: "Comunidade",   path: "/comunidade"                 },
  { label: "Guias",        path: "/guias"                      },
];

// Links que só aparecem quando o usuário está autenticado
const AUTH_NAV_LINKS = [];

// Itens do dropdown de perfil
const PROFILE_MENU = [
  { label: "Configurações", path: "/configuracoes", Icon: Settings },
];

// ─────────────────────────────────────────────────────────────────────────────

function getInitials(user) {
  if (!user) return "?";
  if (user.displayName) {
    return user.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (user.email?.[0] ?? "U").toUpperCase();
}

function getDisplayName(user) {
  if (!user) return "";
  return user.displayName || user.email?.split("@")[0] || "Usuário";
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);       // mobile menu
  const [dropdownOpen, setDropdownOpen] = useState(false); // perfil dropdown
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const avatarBtnRef = useRef(null);

  // Sombra ao rolar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha menu mobile ao mudar de rota
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !avatarBtnRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Trava o scroll do body quando o menu mobile está aberto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setDropdownOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  const allLinks = [
    ...NAV_LINKS,
    ...(currentUser ? AUTH_NAV_LINKS : []),
  ];

  // Páginas de autenticação são tela cheia — sem cabeçalho
  const ROTAS_SEM_NAV = ["/login", "/cadastro", "/esqueci-senha"];
  if (ROTAS_SEM_NAV.includes(location.pathname)) return null;

  return (
    <>
      <header className={`cn-nav${scrolled ? " cn-nav--scrolled" : ""}`} role="banner">
        <div className="cn-nav__inner">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link to="/" className="cn-nav__logo" aria-label={`${SITE_NAME} — ir para o início`}>
            <img src={Logo} alt={SITE_NAME} className="cn-nav__logo-img" />
            <span className="cn-nav__logo-text">{SITE_NAME}</span>
          </Link>

          {/* ── Links desktop ─────────────────────────────────────────────── */}
          <nav className="cn-nav__links" aria-label="Navegação principal">
            {allLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) =>
                  `cn-nav__link${isActive ? " cn-nav__link--active" : ""}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ── Lado direito ──────────────────────────────────────────────── */}
          <div className="cn-nav__actions">
            {currentUser ? (
              /* ── Usuário autenticado: avatar + dropdown ── */
              <div className="cn-nav__profile-wrap">
                <button
                  ref={avatarBtnRef}
                  className={`cn-nav__avatar-btn${dropdownOpen ? " cn-nav__avatar-btn--open" : ""}`}
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                  aria-label="Menu do perfil"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={getDisplayName(currentUser)}
                      className="cn-nav__avatar-img"
                    />
                  ) : (
                    <span className="cn-nav__avatar-initials">
                      {getInitials(currentUser)}
                    </span>
                  )}
                  <span className="cn-nav__avatar-name">
                    {getDisplayName(currentUser)}
                  </span>
                  <svg
                    className={`cn-nav__chevron${dropdownOpen ? " cn-nav__chevron--up" : ""}`}
                    width="12" height="12" viewBox="0 0 12 12"
                    fill="none" aria-hidden="true"
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="cn-nav__dropdown"
                    role="menu"
                    aria-label="Opções do perfil"
                  >
                    <div className="cn-nav__dropdown-header">
                      <span className="cn-nav__dropdown-name">
                        {getDisplayName(currentUser)}
                      </span>
                      <span className="cn-nav__dropdown-email">
                        {currentUser.email}
                      </span>
                    </div>

                    <div className="cn-nav__dropdown-divider" />

                    {PROFILE_MENU.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="cn-nav__dropdown-item"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <item.Icon size={16} aria-hidden="true" />
                        {item.label}
                      </Link>
                    ))}

                    <div className="cn-nav__dropdown-divider" />

                    <button
                      className="cn-nav__dropdown-item cn-nav__dropdown-item--danger"
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Usuário não autenticado: entrar / criar conta ── */
              <div className="cn-nav__auth-btns">
                <Link to="/login" className="cn-nav__btn-ghost">
                  Entrar
                </Link>
                <Link to="/cadastro" className="cn-nav__btn-primary">
                  Criar conta
                </Link>
              </div>
            )}

            {/* ── Botão hamburguer (mobile) ──────────────────────────────── */}
            <button
              className={`cn-nav__hamburger${menuOpen ? " cn-nav__hamburger--open" : ""}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls="cn-nav-mobile-menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* ── Menu mobile ───────────────────────────────────────────────────── */}
      <div
        id="cn-nav-mobile-menu"
        className={`cn-nav__mobile${menuOpen ? " cn-nav__mobile--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Navegação mobile">
          {allLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `cn-nav__mobile-link${isActive ? " cn-nav__mobile-link--active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="cn-nav__mobile-divider" />

        {currentUser ? (
          <div className="cn-nav__mobile-user">
            <div className="cn-nav__mobile-userinfo">
              <span className="cn-nav__mobile-username">
                {getDisplayName(currentUser)}
              </span>
              <span className="cn-nav__mobile-useremail">
                {currentUser.email}
              </span>
            </div>
            {PROFILE_MENU.map((item) => (
              <Link key={item.path} to={item.path} className="cn-nav__mobile-link">
                <item.Icon size={18} aria-hidden="true" /> {item.label}
              </Link>
            ))}
            <button
              className="cn-nav__mobile-signout"
              onClick={handleSignOut}
            >
              Sair da conta
            </button>
          </div>
        ) : (
          <div className="cn-nav__mobile-auth">
            <Link to="/login"    className="cn-nav__btn-ghost cn-nav__btn--full">Entrar</Link>
            <Link to="/cadastro" className="cn-nav__btn-primary cn-nav__btn--full">Criar conta</Link>
          </div>
        )}
      </div>

      {/* Overlay escuro atrás do menu mobile */}
      {menuOpen && (
        <div
          className="cn-nav__overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}