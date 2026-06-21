import { useEffect, useState } from 'react';
import './Splash.css';

function Splash({ onTerminar }) {
    const [creciendo, setCreciendo] = useState(false);

    useEffect(() => {
        const t1 = setTimeout(() => setCreciendo(true), 2000);
        const t2 = setTimeout(() => onTerminar(), 2600);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    return (
        <div className={`splash ${creciendo ? 'splash-crecer' : ''}`}>
            <svg width="120" height="120" viewBox="0 0 140 140">
                <defs>
                    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B7FFF" />
                        <stop offset="100%" stopColor="#4338CA" />
                    </linearGradient>
                </defs>
                <rect width="140" height="140" rx="28" fill="url(#splashGrad)" />
                <rect x="35" y="80" width="14" height="30" rx="6" fill="white" />
                <rect x="58" y="65" width="14" height="45" rx="6" fill="white" />
                <rect x="81" y="45" width="14" height="65" rx="6" fill="white" />
                <circle cx="88" cy="35" r="5" fill="white" />
            </svg>
            <h1>NOVU</h1>
            <p>CONTROL TOTAL</p>
        </div>
    );
}

export default Splash;