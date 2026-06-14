import "./Navbar.css"

function Navbar() {
    return (
        <div className="navbar">
            <h1>Navbar</h1>
            <div className="nav-item">
                <button>Inicio</button>
                <button>Analisis</button>
                <button>Aprender</button>
                <button>Config</button>
            </div>
        </div>
    );
}

export default Navbar;