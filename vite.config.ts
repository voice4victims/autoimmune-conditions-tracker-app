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
          chunkFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name]-[hash].js',
          entryFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name]-[hash].js',
          assetFileNames: isProduction ? 'assets/[hash].[ext]' : 'assets/[name]-[hash].[ext]',
          banner: '',
          manualChunks(id) {
            if (id.includes('node_modules/firebase')) return 'vendor-firebase';
            if (id.includes('node_modules/@radix-ui')) return 'vendor-radix';
            if (id.includes('node_modules/@capacitor')) return 'vendor-capacitor';
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-charts';
          },
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
