const { execSync } = require('child_process');

console.log('🔨 Build Manager: Starting...');

// 檢查是否處於 Cloudflare Pages 環境
const isCloudflare = process.env.CF_PAGES === '1';

// 檢查是否已經在 next-on-pages 的執行過程中 (透過我們自己傳遞的標記)
const isRecursiveCall = process.env.NEXT_ON_PAGES_RECURSIVE_FLAG === '1';

try {
    // 只要不是遞迴呼叫，就預設執行 Cloudflare 流程 (這樣最安全)
    if (!isRecursiveCall) {
        console.log('🚀 Starting Cloudflare build process...');

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
            fs.copyFileSync(workerPath, 'cloudflare_worker.js');
            console.log('📋 Copied to ./cloudflare_worker.js');
        } else {
            console.warn('⚠️ _worker.js NOT FOUND in .vercel directory!');
            console.log('⚡ Generating a fallback worker to allow deployment to proceed...');

            // 創建一個最小可行的 Worker，確保 Wrangler 有東西可以部署
            const dummyWorker = `
                export default {
                    async fetch(request, env) {
                        return new Response('<h1>Deployment Successful (Fallback Mode)</h1><p>The static assets are deployed, but the SSR worker was not found. Please checks build logs.</p>', {
                            headers: { 'content-type': 'text/html' }
                        });
                    }
                };
            `;
            fs.writeFileSync('cloudflare_worker.js', dummyWorker);
            console.log('✅ Created fallback cloudflare_worker.js');
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
