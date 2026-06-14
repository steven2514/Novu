import './Header.css';

function Header() {

    const nombre = 'steven';
    return (
        <div className="header">
            <div className="header-saludo">
                <h1>Buenos dias, {nombre} 👋</h1>
            </div>
            <div className="avatar">S</div>
        </div>
    );
}

export default Header;