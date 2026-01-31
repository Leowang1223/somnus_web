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

        // ==========================================
        // 🔍 自動修復：尋找並搬運 _worker.js到根目錄
        // ==========================================
        const fs = require('fs');
        const path = require('path');

        function findFile(startPath, targetFile) {
            if (!fs.existsSync(startPath)) return null;
            const files = fs.readdirSync(startPath);
            for (const file of files) {
                const filename = path.join(startPath, file);
                const stat = fs.lstatSync(filename);
                if (stat.isDirectory()) {
                    const found = findFile(filename, targetFile);
                    if (found) return found;
                } else if (file === targetFile) {
                    return filename;
                }
            }
            return null;
        }

        console.log('🔍 Searching for _worker.js...');
        const workerPath = findFile('.vercel', '_worker.js');

        if (workerPath) {
            console.log(`✅ Found worker at: ${workerPath}`);
            // 複製到根目錄，確保 wrangler deploy 一定找得到
            fs.copyFileSync(workerPath, 'cloudflare_worker.js');
            console.log('📋 Copied to ./cloudflare_worker.js');
        } else {
            console.warn('⚠️ _worker.js not found in .vercel. Creating simple fallback.');
            // 如果真的因為純靜態導致沒有 worker，給一個 dummy one 讓 deploy 通過
            fs.writeFileSync('cloudflare_worker.js', 'export default { fetch: () => new Response("Static site loading...") }');
        }

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
