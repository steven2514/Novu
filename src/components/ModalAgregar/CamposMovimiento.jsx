import { useId } from 'react';
import { useIdioma, nombreCategoria } from '../../i18n/idioma';
import { usePreferencias } from '../../Context/preferencias';
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from '../../utils/categorias';
import CampoMonto from '../CampoMonto';
import DropdownPildora from './DropdownPildora';

// Campos de un gasto o ingreso. `campos` = { monto, categoria, cuenta, fecha, nota }
export function CamposMovimiento({ tipo, campos, cambiar, cuentas }) {
    const id = useId();
    const { t } = useIdioma();
    const { moneda } = usePreferencias();

    const categorias = (tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO)
        .map(valor => ({ value: valor, label: nombreCategoria(valor) }));
    const opcionesCuentas = cuentas.map(c => ({ value: c.nombre, label: c.nombre }));

    return (
        <div className="modal-agregar-body">
            <label htmlFor={`${id}-monto`}>{t('comun.monto')} ({moneda})</label>
            <CampoMonto id={`${id}-monto`} value={campos.monto} onChange={(v) => cambiar('monto', v)} />

            <label htmlFor={`${id}-categoria`}>{t('comun.categoria')}</label>
            <DropdownPildora id={`${id}-categoria`} value={campos.categoria} onChange={(v) => cambiar('categoria', v)} opciones={categorias} placeholder={t('agregar.seleccionarCategoria')} />

            <label htmlFor={`${id}-cuenta`}>{t('comun.cuenta')}</label>
            <DropdownPildora id={`${id}-cuenta`} value={campos.cuenta} onChange={(v) => cambiar('cuenta', v)} opciones={opcionesCuentas} placeholder={t('comun.seleccionarCuenta')} />

            <div className="modal-agregar-fila-doble">
                <div>
                    <label htmlFor={`${id}-fecha`}>{t('comun.fecha')}</label>
                    <input id={`${id}-fecha`} className="campo-pildora" type="date" value={campos.fecha} onChange={(e) => cambiar('fecha', e.target.value)} />
                </div>
                <div>
                    <label htmlFor={`${id}-nota`}>{t('agregar.nota')}</label>
                    <input id={`${id}-nota`} className="campo-pildora" type="text" value={campos.nota} onChange={(e) => cambiar('nota', e.target.value)} placeholder={t('comun.opcional')} />
                </div>
            </div>
        </div>
    );
}

// Campos de una transferencia entre cuentas o de un aporte a meta.
// `campos` = { origen, destino, monto }
export function CamposTransferencia({ esAporte, campos, cambiar, cuentas, metas }) {
    const id = useId();
    const { t } = useIdioma();
    const { moneda } = usePreferencias();

    const opcionesOrigen = cuentas.map(c => ({ value: c.nombre, label: c.nombre }));
    const opcionesDestino = esAporte
        ? metas.map(m => ({ value: m.nombre_meta, label: m.nombre_meta }))
        : cuentas.filter(c => c.nombre !== campos.origen).map(c => ({ value: c.nombre, label: c.nombre }));

    return (
        <div className="modal-agregar-body">
            <label htmlFor={`${id}-origen`}>{t('agregar.desde')}</label>
            <DropdownPildora id={`${id}-origen`} value={campos.origen} onChange={(v) => cambiar('origen', v)} opciones={opcionesOrigen} placeholder={t('agregar.seleccionarOrigen')} />

            <label htmlFor={`${id}-destino`}>{esAporte ? t('agregar.meta') : t('agregar.hacia')}</label>
            <DropdownPildora
                id={`${id}-destino`}
                value={campos.destino}
                onChange={(v) => cambiar('destino', v)}
                opciones={opcionesDestino}
                placeholder={esAporte ? t('agregar.seleccionarMeta') : t('agregar.seleccionarDestino')}
            />

            <label htmlFor={`${id}-monto`}>{t('comun.monto')} ({moneda})</label>
            <CampoMonto id={`${id}-monto`} value={campos.monto} onChange={(v) => cambiar('monto', v)} />
        </div>
    );
}
