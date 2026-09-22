// Verbatim from docs pack 11-docs-shell-reference/components.md §7. Inlined into <head> by root.tsx
// before any stylesheet, so the theme is set before the first paint (02 §8).
export const themeBootstrap = `(function(){try{var t=localStorage.getItem('ds:theme');
if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`;
