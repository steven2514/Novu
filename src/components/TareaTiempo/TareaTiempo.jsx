import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { useIdioma } from '../../i18n/idioma';
import { segundosTrabajados, segundosHastaTerminar, duracionCorta, reloj } from '../../utils/tareas';

// Tiempo de una tarea, dentro de su fila:
// - pendiente: botón del cronómetro (Empezar / reloj corriendo / tiempo acumulado)
// - terminada: cuánto tardó desde que se creó y cuánto trabajaste vs. lo estimado

function TareaTiempo({ tarea, onCronometro }) {
    const { t } = useIdioma();
    const corriendo = !tarea.completada && !!tarea.cronometro_desde;
    const [ahora, setAhora] = useState(() => new Date());

    // Mientras corre, el reloj se actualiza cada segundo
    useEffect(() => {
        if (!corriendo) return undefined;
        const intervalo = setInterval(() => setAhora(new Date()), 1000);
        return () => clearInterval(intervalo);
    }, [corriendo]);

    const segundos = segundosTrabajados(tarea, corriendo ? ahora : new Date());
    const estimado = tarea.minutos_estimados ? duracionCorta(tarea.minutos_estimados * 60) : null;

    if (tarea.completada) {
        const total = segundosHastaTerminar(tarea);
        const pasado = tarea.minutos_estimados && segundos > tarea.minutos_estimados * 60;
        return (
            <>
                {total !== null && (
                    <span className="tarea-tiempo">
                        <Icon name="clock" size={12} />
                        {t('tareas.terminadaEn', { tiempo: textoTotal(total, t) })}
                    </span>
                )}
                {segundos > 0 && (
                    <span className={`tarea-tiempo ${estimado ? (pasado ? 'tiempo-pasado' : 'tiempo-a-tiempo') : ''}`}>
                        <Icon name="timer" size={12} />
                        {estimado
                            ? t('tareas.trabajadoDe', { tiempo: duracionCorta(segundos), estimado })
                            : t('tareas.trabajado', { tiempo: duracionCorta(segundos) })}
                    </span>
                )}
            </>
        );
    }

    return (
        <>
            {estimado && (
                <span className="tarea-tiempo">
                    <Icon name="hourglass" size={12} />
                    {t('tareas.estimado', { tiempo: estimado })}
                </span>
            )}
            <button
                type="button"
                className={`tarea-cronometro ${corriendo ? 'cronometro-corriendo' : ''}`}
                onClick={() => onCronometro(tarea)}
                aria-label={t(corriendo ? 'tareas.pausarCronometro' : 'tareas.empezarCronometro', { nombre: tarea.titulo })}
                aria-pressed={corriendo}
            >
                <Icon name={corriendo ? 'pause' : 'play'} size={12} />
                {corriendo ? reloj(segundos) : segundos > 0 ? duracionCorta(segundos) : t('tareas.empezar')}
            </button>
        </>
    );
}

// Menos de un día: '3 h 20 min'. Desde un día: '2 días'.
function textoTotal(segundos, t) {
    const dias = Math.floor(segundos / 86400);
    return dias >= 1 ? t('tareas.dias', { n: dias }) : duracionCorta(segundos);
}

export default TareaTiempo;
