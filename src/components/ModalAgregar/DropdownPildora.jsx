import { useState, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";

// ─── Iconos SVG propios (no dependen del mapeo de Icon) ───
function ChevronDownIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}
function CheckIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

// ─── Dropdown personalizado ───
// El panel va en un portal (document.body) para que el overflow del modal no lo
// recorte. Se coloca debajo del campo si cabe y, si no, ENCIMA: antes se abría
// siempre hacia abajo y en el campo "Cuenta", que está al final del formulario,
// la lista se salía de la pantalla. Se reubica con el scroll y el resize.
// Accesible con teclado: flechas para moverse, Enter para elegir, Escape/Tab
// para cerrar.
const ALTO_MAX_PANEL = 280;
const MARGEN = 8;

function calcularPosicion(rect, cantidad) {
    const altoIdeal = Math.min(ALTO_MAX_PANEL, cantidad * 42 + 12);
    const abajo = window.innerHeight - rect.bottom - MARGEN;
    const arriba = rect.top - MARGEN;
    const haciaArriba = abajo < altoIdeal && arriba > abajo;
    const disponible = Math.max(120, (haciaArriba ? arriba : abajo) - 6);
    return {
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(ALTO_MAX_PANEL, disponible),
        ...(haciaArriba
            ? { bottom: window.innerHeight - rect.top + 6 }
            : { top: rect.bottom + 6 }),
    };
}

function DropdownPildora({ id, value, onChange, opciones, placeholder }) {
    const [abierto, setAbierto] = useState(false);
    const [pos, setPos] = useState(null);
    const [activa, setActiva] = useState(-1);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const idLista = useId();

    function cerrar(devolverFoco = false) {
        setAbierto(false);
        if (devolverFoco) triggerRef.current?.focus();
    }

    function abrir() {
        setPos(calcularPosicion(triggerRef.current.getBoundingClientRect(), opciones.length));
        setActiva(Math.max(0, opciones.findIndex(o => o.value === value)));
        setAbierto(true);
    }

    function elegir(opcion) {
        onChange(opcion.value);
        cerrar(true);
    }

    // Clic fuera cierra; scroll o resize reubican el panel junto al campo.
    useEffect(() => {
        if (!abierto) return;
        function clicFuera(e) {
            if (!triggerRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) cerrar();
        }
        function reubicar(e) {
            if (panelRef.current?.contains(e.target)) return; // scroll dentro de la propia lista
            setPos(calcularPosicion(triggerRef.current.getBoundingClientRect(), opciones.length));
        }
        document.addEventListener('mousedown', clicFuera);
        window.addEventListener('scroll', reubicar, true);
        window.addEventListener('resize', reubicar);
        return () => {
            document.removeEventListener('mousedown', clicFuera);
            window.removeEventListener('scroll', reubicar, true);
            window.removeEventListener('resize', reubicar);
        };
    }, [abierto, opciones.length]);

    // La opción activa siempre visible al moverse con las flechas.
    useEffect(() => {
        if (abierto && activa >= 0) {
            panelRef.current?.children[activa]?.scrollIntoView({ block: 'nearest' });
        }
    }, [abierto, activa]);

    // Qué hace cada tecla con la lista abierta
    const ultima = opciones.length - 1;
    const teclasAbierto = {
        ArrowDown: () => setActiva(i => Math.min(ultima, i + 1)),
        ArrowUp: () => setActiva(i => Math.max(0, i - 1)),
        Home: () => setActiva(0),
        End: () => setActiva(ultima),
        Enter: () => opciones[activa] && elegir(opciones[activa]),
        ' ': () => opciones[activa] && elegir(opciones[activa]),
        Escape: () => cerrar(true),
    };
    const teclasCerrado = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

    function teclado(e) {
        if (!abierto) {
            if (teclasCerrado.includes(e.key)) { e.preventDefault(); abrir(); }
            return;
        }
        // Tab cierra pero deja que el foco pase al siguiente campo
        if (e.key === 'Tab') { cerrar(); return; }
        const accion = teclasAbierto[e.key];
        if (accion) { e.preventDefault(); accion(); }
    }

    const seleccionada = opciones.find(o => o.value === value);

    return (
        <div className="dropdown-pildora">
            <button
                ref={triggerRef}
                id={id}
                type="button"
                role="combobox"
                className="campo-pildora dropdown-pildora-trigger"
                onClick={() => (abierto ? cerrar() : abrir())}
                onKeyDown={teclado}
                aria-haspopup="listbox"
                aria-expanded={abierto}
                aria-controls={abierto ? idLista : undefined}
                aria-activedescendant={abierto && activa >= 0 ? `${idLista}-${activa}` : undefined}
            >
                <span className={`dropdown-pildora-valor ${seleccionada ? '' : 'dropdown-placeholder'}`}>
                    {seleccionada ? seleccionada.label : placeholder}
                </span>
                <ChevronDownIcon />
            </button>
            {abierto && pos && createPortal(
                <ul ref={panelRef} id={idLista} role="listbox" className="dropdown-pildora-panel" style={pos}>
                    {opciones.length === 0 && <li className="dropdown-pildora-vacio">{placeholder}</li>}
                    {opciones.map((o, i) => (
                        <li
                            key={o.value}
                            id={`${idLista}-${i}`}
                            role="option"
                            aria-selected={value === o.value}
                            className={`dropdown-pildora-opcion ${value === o.value ? 'seleccionada' : ''} ${i === activa ? 'activa' : ''}`}
                            onMouseEnter={() => setActiva(i)}
                            onMouseDown={(e) => e.preventDefault()} /* el foco se queda en el botón */
                            onClick={() => elegir(o)}
                        >
                            <span>{o.label}</span>
                            {value === o.value && <CheckIcon />}
                        </li>
                    ))}
                </ul>,
                document.body
            )}
        </div>
    );
}

export default DropdownPildora;
