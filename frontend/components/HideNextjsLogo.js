"use client";
import { useEffect } from 'react';

export default function HideNextjsLogo() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            // Actively monitor and destroy the Next.js dev indicator portal as soon as it spawns
            const observer = new MutationObserver(() => {
                const elements = document.querySelectorAll('nextjs-portal, #nextjs-dev-indicator');
                elements.forEach(el => {
                    if (el && el.style.display !== 'none') {
                        el.style.setProperty('display', 'none', 'important');
                        el.style.setProperty('visibility', 'hidden', 'important');
                        el.style.setProperty('opacity', '0', 'important');
                    }
                });
            });

            observer.observe(document.documentElement, { childList: true, subtree: true });

            return () => observer.disconnect();
        }
    }, []);

    return null;
}
