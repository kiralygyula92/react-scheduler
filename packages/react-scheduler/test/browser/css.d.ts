// Stylesheets are side-effect imports in the browser tests (Vite injects them).
declare module '*.css';

// Asset URLs (Vite ?url imports).
declare module '*?url' {
  const url: string;
  export default url;
}
