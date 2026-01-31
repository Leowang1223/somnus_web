const { execSync } = require('child_process');

console.log('🔨 Build Manager: Starting...');

// 檢查是否處於 Cloudflare Pages 環境
const isCloudflare = process.env.CF_PAGES === '1';

// 檢查是否已經在 next-on-pages 的執行過程中 (透過我們自己傳遞的標記)
const isRecursiveCall = process.env.NEXT_ON_PAGES_RECURSIVE_FLAG === '1';

try {
    if (isCloudflare && !isRecursiveCall) {
        console.log('☁️ Detected Cloudflare Pages root build.');
        console.log('🚀 Launching @cloudflare/next-on-pages...');

        // 設置遞迴標記，防止無限迴圈
        const newEnv = { ...process.env, NEXT_ON_PAGES_RECURSIVE_FLAG: '1' };

        // 執行 Cloudflare 適配器 (它會回頭再次呼叫 npm run build)
        execSync('npx @cloudflare/next-on-pages', {
            stdio: 'inherit',
            env: newEnv
        });

    } else {
        // 如果是本地開發，或是 Cloudflare 內部的遞迴呼叫，就執行真正的 Next.js 編譯
        if (isRecursiveCall) {
            console.log('🔄 Detected recursive call from adapter. Running actual build...');
        } else {
            console.log('💻 Detected local/standard build. Running next build...');
        }

        execSync('npx next build', { stdio: 'inherit' });
    }

    console.log('✅ Build completed successfully.');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
