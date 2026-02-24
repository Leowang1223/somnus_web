/**
 * POST /api/logistics/cvs-callback
 *
 * ECPay CVS 選店完成後，ECPay 將門市資訊 POST 到此 endpoint
 * 我們把門市資訊轉為 query params 後 redirect 到 /logistics/cvs-callback，
 * 由 client-side page 接收並透過 postMessage 傳回結帳頁面
 */

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const params = Object.fromEntries(formData) as Record<string, string>;

        // ECPay 傳回的門市資訊
        const storeId      = params.CVSStoreID   || '';
        const storeName    = params.CVSStoreName  || '';
        const storeAddress = params.CVSAddress    || '';
        const storeOutside = params.CVSOutSide    || '0'; // 1=距門市0.5公里以上
        const subType      = params.LogisticsSubType || 'UNIMART';

        // 轉換 subType 為友善名稱
        const displayType = subType === 'FAMI' ? 'fami' : '711';

        const callbackUrl = new URL('/logistics/cvs-callback', new URL(req.url).origin);
        callbackUrl.searchParams.set('store_id',      storeId);
        callbackUrl.searchParams.set('store_name',    storeName);
        callbackUrl.searchParams.set('store_address', storeAddress);
        callbackUrl.searchParams.set('sub_type',      subType);
        callbackUrl.searchParams.set('display_type',  displayType);
        callbackUrl.searchParams.set('outside',       storeOutside);

        return Response.redirect(callbackUrl.toString(), 302);
    } catch (e: any) {
        console.error('[cvs-callback] error:', e);
        return new Response('Error', { status: 500 });
    }
}
