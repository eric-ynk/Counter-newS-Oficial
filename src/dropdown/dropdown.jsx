// components/Dropdown.jsx
import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './dropdown.css';

/**
 * Dropdown personalizado — substitui o <select> nativo em qualquer
 * formulário do site, mantendo o mesmo visual em todos os inputs.
 *
 * Uso:
 * <Dropdown
 *   options={[{ value: 'todas', label: 'Todas as regiões' }, { value: 'br', label: 'Brasil' }]}
 *   value={regiao}
 *   onChange={setRegiao}
 *   placeholder="Selecione a região"
 * />
 */
export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Selecione...',
  disabled = false,
  name,
}) {
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);
  const id = useId();

  const selecionado = options.find((o) => o.value === value);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickFora(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  // Ao abrir, foca a opção selecionada (ou a primeira)
  useEffect(() => {
    if (aberto) {
      const idx = options.findIndex((o) => o.value === value);
      setFoco(idx >= 0 ? idx : 0);
    }
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rola a opção focada pra dentro da view
  useEffect(() => {
    if (aberto && listRef.current) {
      const item = listRef.current.children[foco];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [foco, aberto]);

  function selecionar(opcao) {
    if (opcao.disabled) return;
    onChange?.(opcao.value);
    setAberto(false);
  }

  function handleKeyDown(e) {
    if (disabled) return;

    if (!aberto) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setAberto(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFoco((f) => Math.min(f + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFoco((f) => Math.max(f - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setFoco(0);
        break;
      case 'End':
        e.preventDefault();
        setFoco(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (options[foco]) selecionar(options[foco]);
        break;
      case 'Escape':
        e.preventDefault();
        setAberto(false);
        break;
      default:
        break;
    }
  }

  return (
    <div className='dd' ref={wrapperRef}>
      <button
        type='button'
        className={`dd-trigger${aberto ? ' dd-trigger--aberto' : ''}`}
        onClick={() => !disabled && setAberto((a) => !a)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        role='combobox'
        aria-haspopup='listbox'
        aria-expanded={aberto}
        aria-controls={`${id}-lista`}
        id={id}
        name={name}
      >
        <span className={selecionado ? 'dd-trigger__valor' : 'dd-trigger__placeholder'}>
          {selecionado ? selecionado.label : placeholder}
        </span>
        <ChevronDown size={16} className='dd-trigger__seta' aria-hidden='true' />
      </button>

      {aberto && (
        <ul className='dd-lista' role='listbox' id={`${id}-lista`} ref={listRef} tabIndex={-1}>
          {options.map((opcao, i) => (
            <li
              key={opcao.value}
              role='option'
              aria-selected={opcao.value === value}
              className={[
                'dd-opcao',
                opcao.value === value && 'dd-opcao--selecionada',
                i === foco && 'dd-opcao--foco',
                opcao.disabled && 'dd-opcao--desabilitada',
              ].filter(Boolean).join(' ')}
              onMouseEnter={() => setFoco(i)}
              onClick={() => selecionar(opcao)}
            >
              <span>{opcao.label}</span>
              {opcao.value === value && <Check size={15} aria-hidden='true' />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}