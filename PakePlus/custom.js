// ========== 🔖 标识输出 ==========
console.log(
    '%cBuild from PakePlus: https://github.com/Sjj1024/PakePlus',
    'color:orangered; font-weight:bold; background:#fff3f3; padding:2px 6px; border-radius:4px; font-size:12px;'
);

// ========== ⚙️ 配置项（可自定义） ==========
const PakePlus = {
    // 是否启用调试日志
    debug: true,

    // 允许放行的外链域名（不拦截这些链接）
    externalWhitelist: [
        'baidu.com',
        'google.com',
        'github.com'
        // 添加你需要的域名
    ],

    // 是否清理分类页的 hash（防止自动跳转）
    cleanHashOnCategory: true,

    // 分类页路径关键词
    categoryPaths: ['/category', '/games', '/list', '/tag']
};

// ========== 🛠️ 工具函数 ==========
function log(...args) {
    if (PakePlus.debug) console.log('[PakePlus]', ...args);
}

function isExternal(url) {
    try {
        return new URL(url, window.location.origin).origin !== window.location.origin;
    } catch (e) {
        return true;
    }
}

function isWhitelisted(url) {
    return PakePlus.externalWhitelist.some(host => url.includes(host));
}

function isInCategoryPage() {
    return PakePlus.categoryPaths.some(path => window.location.pathname.startsWith(path));
}

function cleanupUrlHash() {
    if (PakePlus.cleanHashOnCategory && isInCategoryPage() && window.location.hash) {
        const cleanUrl = window.location.pathname + window.location.search;
        log('Cleaning URL hash to prevent auto-redirect:', window.location.hash);
        history.replaceState(null, '', cleanUrl);
    }
}

// ========== ✅ 优化版点击拦截 ==========
const hookClick = (e) => {
    const anchor = e.target.closest('a');
    if (!anchor || !anchor.href) return;

    const href = anchor.href;
    const target = anchor.target;

    // 判断是否受 <base target="_blank"> 影响
    const baseTargetBlank = document.querySelector('head base[target="_blank"]');

    // 是否需要拦截：target="_blank" 或受 base 影响
    const shouldIntercept = 
        target === '_blank' || 
        (baseTargetBlank && !['', '_self', '_parent', '_top'].includes(target));

    if (!shouldIntercept) {
        log('Not intercepting (not _blank):', href, 'target:', target);
        return;
    }

    // 白名单放行（外链白名单）
    if (isWhitelisted(href)) {
        log('Whitelisted link, allowing native behavior:', href);
        return;
    }

    // 阻止默认行为
    e.preventDefault();
    log('Intercepted and redirecting:', href);

    // ✅ 使用 replace 而不是 href，避免污染 history
    window.location.replace(href);
};

// ========== ✅ 修复 window.open ==========
const originalOpen = window.open;

window.open = function (url, target = '_blank', features) {
    log('window.open called:', { url, target, features });

    // 如果是允许的行为（如 _self），放行
    if (!['_blank', ''].includes(target)) {
        return originalOpen.call(this, url, target, features);
    }

    // 白名单放行
    if (isWhitelisted(url)) {
        log('Whitelisted window.open:', url);
        return originalOpen.call(this, url, target, features);
    }

    // 否则拦截：当前页跳转
    log('Intercepted window.open -> redirecting:', url);
    window.location.replace(url);
};

// ========== 📣 注册事件 ==========
document.addEventListener('click', hookClick, { capture: true });

// ========== 🧹 初始化：清理 URL（关键修复！）==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanupUrlHash);
} else {
    cleanupUrlHash();
}

// 可选：监听页面可见性变化，防止“恢复”逻辑
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isInCategoryPage()) {
        log('Page visible in category, consider preventing auto-continue...');
        // localStorage.removeItem('lastPlayedGame'); // 如需可取消注释
    }
});

// ========== 💡 调试提示 ==========
log('Hook system initialized. Config:', PakePlus);