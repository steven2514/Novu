import './Legal.css';

function Privacidad() {
    return (
        <div className="legal-page">
            <h1>Política de Privacidad</h1>
            <p className="legal-fecha">Última actualización: junio de 2026</p>

            <h2>1. Qué datos recolectamos</h2>
            <p>Cuando usas NOVU, recolectamos:</p>
            <ul>
                <li>Correo electrónico y contraseña (para tu cuenta)</li>
                <li>Transacciones, cuentas, metas, suscripciones y tareas que registres manualmente</li>
            </ul>

            <h2>2. Cómo almacenamos tus datos</h2>
            <p>Tus datos se almacenan de forma segura en Supabase, una plataforma de base de datos en la nube. Cada usuario solo puede ver y modificar su propia información, gracias a políticas de seguridad a nivel de fila (Row Level Security).</p>

            <h2>3. Para qué usamos tus datos</h2>
            <p>Usamos tus datos únicamente para mostrarte tu propia información dentro de la app: balances, gráficas, metas y tareas. No vendemos ni compartimos tus datos con terceros.</p>

            <h2>4. Tus derechos</h2>
            <p>Puedes solicitar la eliminación de tu cuenta y de todos tus datos en cualquier momento, contactándonos a través del repositorio del proyecto.</p>

            <h2>5. Cambios en esta política</h2>
            <p>Esta política puede actualizarse a medida que NOVU evolucione. Te recomendamos revisarla periódicamente.</p>

            <h2>6. Contacto</h2>
            <p>github.com/steven2514/Novu</p>
            <p>WhatsApp: <a href="https://wa.me/573113065812" target="_blank" rel="noopener noreferrer">+57 311 306 5812</a></p>
        </div>
    );
}

export default Privacidad;