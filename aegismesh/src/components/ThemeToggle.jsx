import { useEffect,useState } from 'react';
import { Moon,Sun } from 'lucide-react';
export default function ThemeToggle({compact=false}){
  const [theme,setTheme]=useState(()=>localStorage.getItem('aegis_theme')||'dark');
  useEffect(()=>{document.documentElement.classList.toggle('light',theme==='light');document.documentElement.classList.toggle('dark',theme==='dark');localStorage.setItem('aegis_theme',theme);},[theme]);
  return <button aria-label={`Switch to ${theme==='dark'?'light':'dark'} mode`} onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="group inline-flex items-center gap-2 border border-border bg-card/70 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition aegis-corner-cut">
    {theme==='dark'?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}{!compact&&<span>{theme==='dark'?'Light':'Dark'}</span>}
  </button>;
}
