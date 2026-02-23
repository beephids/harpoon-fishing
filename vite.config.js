import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
    const configuredBase = process.env.VITE_BASE_PATH?.trim();
    const base = command === 'build'
        ? (configuredBase && configuredBase.length > 0 ? configuredBase : './')
        : '/';

    return {
        root: '.',
        publicDir: 'assets',
        base,
        build: {
            outDir: 'dist',
            assetsDir: 'assets',
        },
        server: {
            port: 3000,
            open: true,
        },
    };
});
