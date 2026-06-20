import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useTour(nombreTour, sesion) {
    const [mostrarTour, setMostrarTour] = useState(false);

    useEffect(() => {
        if (!sesion) return;
        supabase.from('perfiles').select('*').eq('user_id', sesion.user.id).then(({ data }) => {
            if (data && data.length > 0) {
                const vistos = data[0].tours_vistos || '';
                if (!vistos.split(',').includes(nombreTour)) {
                    setMostrarTour(true);
                }
            }
        });
    }, [sesion]);

    function cerrarTour() {
        setMostrarTour(false);
        if (sesion) {
            supabase.from('perfiles').select('*').eq('user_id', sesion.user.id).then(({ data }) => {
                const vistos = data && data[0] ? data[0].tours_vistos || '' : '';
                const nuevos = vistos === '' ? nombreTour : vistos + ',' + nombreTour;
                supabase.from('perfiles').update({ tours_vistos: nuevos }).eq('user_id', sesion.user.id).then(() => { });
            });
        }
    }

    return { mostrarTour, cerrarTour };
}