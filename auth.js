// 认证逻辑
// Authentication Logic

// 语言管理
const LanguageManager = {
    currentLang: localStorage.getItem('language') || 'en',

    init() {
        this.applyLanguage(this.currentLang);
        this.attachEventListeners();
    },

    applyLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        document.body.className = document.body.className.split(' ').filter(c => !c.startsWith('lang-')).join(' ') + ' lang-' + lang;

        // 更新按钮状态
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    },

    attachEventListeners() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyLanguage(btn.dataset.lang);
            });
        });
    }
};

// 消息管理
const MessageManager = {
    showError(message) {
        const errorEl = document.getElementById('error-message');
        const successEl = document.getElementById('success-message');
        successEl.style.display = 'none';
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => errorEl.style.display = 'none', 5000);
    },

    showSuccess(message) {
        const errorEl = document.getElementById('error-message');
        const successEl = document.getElementById('success-message');
        errorEl.style.display = 'none';
        successEl.textContent = message;
        successEl.style.display = 'block';
        setTimeout(() => successEl.style.display = 'none', 3000);
    },

    clear() {
        document.getElementById('error-message').style.display = 'none';
        document.getElementById('success-message').style.display = 'none';
    }
};

// Tab 切换
function initTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${targetTab}-form`).classList.add('active');

            MessageManager.clear();
        });
    });
}

// 登录
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button');

    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
        await auth.signInWithEmailAndPassword(email, password);
        MessageManager.showSuccess('Login successful! Redirecting...');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) {
        console.error('Login error:', error);
        MessageManager.showError(getErrorMessage(error.code));
        btn.disabled = false;
        btn.innerHTML = '<span class="text-zh">登录</span><span class="text-en">Login</span>';
    }
}

// 注册
async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const btn = e.target.querySelector('button');

    if (password !== confirm) {
        MessageManager.showError('Passwords do not match | 密码不匹配');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Registering...';

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);

        // 初始化用户数据
        await db.collection('users').doc(userCredential.user.uid).set({
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            studyHistory: {},
            stats: {
                totalStudied: 0,
                totalMastered: 0,
                totalErrors: 0
            }
        });

        MessageManager.showSuccess('Registration successful! Redirecting...');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) {
        console.error('Registration error:', error);
        MessageManager.showError(getErrorMessage(error.code));
        btn.disabled = false;
        btn.innerHTML = '<span class="text-zh">注册</span><span class="text-en">Register</span>';
    }
}

// Google 登录
async function handleGoogleLogin() {
    const btn = document.getElementById('google-login-btn');
    btn.disabled = true;

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);

        // 检查是否为新用户
        const userDoc = await db.collection('users').doc(result.user.uid).get();

        if (!userDoc.exists) {
            // 初始化新用户数据
            await db.collection('users').doc(result.user.uid).set({
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                studyHistory: {},
                stats: {
                    totalStudied: 0,
                    totalMastered: 0,
                    totalErrors: 0
                }
            });
        }

        MessageManager.showSuccess('Login successful! Redirecting...');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) {
        console.error('Google login error:', error);
        MessageManager.showError(getErrorMessage(error.code));
        btn.disabled = false;
    }
}

// 错误消息转换
function getErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'Email already in use | 该邮箱已被使用',
        'auth/invalid-email': 'Invalid email address | 无效的邮箱地址',
        'auth/operation-not-allowed': 'Operation not allowed | 操作不被允许',
        'auth/weak-password': 'Password is too weak | 密码过于简单',
        'auth/user-disabled': 'User account is disabled | 用户账户已被禁用',
        'auth/user-not-found': 'User not found | 用户不存在',
        'auth/wrong-password': 'Wrong password | 密码错误',
        'auth/popup-closed-by-user': 'Login popup closed | 登录窗口已关闭',
        'auth/cancelled-popup-request': 'Login cancelled | 登录已取消'
    };

    return messages[code] || `Error: ${code}`;
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    LanguageManager.init();
    initTabs();

    // 检查是否已登录
    const user = await checkAuthState();
    if (user) {
        window.location.href = 'index.html';
        return;
    }

    // 事件监听
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('google-login-btn').addEventListener('click', handleGoogleLogin);
});
