import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
    const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'harpoon-fishing';
    return {
        root: '.',
        publicDir: 'assets',
        base: command === 'build' ? `/${repoName}/` : '/',
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
