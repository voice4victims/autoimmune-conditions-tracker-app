import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    server: {
      host: "::",
      port: 8080,
      https: isProduction ? true : false,
    },
    plugins: [
      react()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Security-focused build configuration
      minify: isProduction ? 'terser' : false,
      sourcemap: !isProduction, // Disable source maps in production
      terserOptions: isProduction ? {
        compress: {
          // Remove console.* calls in production
          drop_console: true,
          drop_debugger: true,
          // Remove unused code
          dead_code: true,
          // Remove comments
          comments: false,
        },
        mangle: {
          // Mangle variable names for obfuscation
          toplevel: true,
        },
        format: {
          // Remove comments
          comments: false,
        },
      } : undefined,
      rollupOptions: {
        output: {
          // Obfuscate chunk names in production
          chunkFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name]-[hash].js',
          entryFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name]-[hash].js',
          assetFileNames: isProduction ? 'assets/[hash].[ext]' : 'assets/[name]-[hash].[ext]',
          // Remove banner comments
          banner: '',
        },
      },
    },
    define: {
      // Remove development-specific globals in production
      __DEV__: !isProduction,
      __PROD__: isProduction,
      // Disable React DevTools in production
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    esbuild: {
      // Remove debug information in production
      drop: isProduction ? ['console', 'debugger'] : [],
      // Minify identifiers
      minifyIdentifiers: isProduction,
      // Minify syntax
      minifySyntax: isProduction,
      // Minify whitespace
      minifyWhitespace: isProduction,
    },
  };
});
