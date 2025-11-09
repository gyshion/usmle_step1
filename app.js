// 主应用逻辑
// Main Application Logic

let currentUser = null;
let userStats = null;

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

        document.querySelectorAll('.lang-btn:not(.logout-btn)').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    },

    attachEventListeners() {
        document.querySelectorAll('.lang-btn:not(.logout-btn)').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyLanguage(btn.dataset.lang);
            });
        });
    }
};

// 用户数据管理
const UserDataManager = {
    async loadUserData(uid) {
        try {
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                userStats = userDoc.data();
                this.updateStatsDisplay();
            } else {
                // 如果用户数据不存在，创建默认数据
                userStats = {
                    email: currentUser.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    studyHistory: {},
                    stats: {
                        totalStudied: 0,
                        totalMastered: 0,
                        totalErrors: 0
                    }
                };
                await db.collection('users').doc(uid).set(userStats);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    },

    updateStatsDisplay() {
        const stats = userStats.stats || { totalStudied: 0, totalMastered: 0, totalErrors: 0 };
        document.getElementById('total-studied').textContent = stats.totalStudied || 0;
        document.getElementById('total-mastered').textContent = stats.totalMastered || 0;
        document.getElementById('total-errors').textContent = stats.totalErrors || 0;
    }
};

// 科目显示
async function displaySubjects() {
    const subjectsGrid = document.getElementById('subject-grid');
    const loading = document.getElementById('subjects-loading');

    try {
        const subjects = await DataLoader.init();

        loading.style.display = 'none';

        subjects.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'subject-card';
            card.innerHTML = `
                <div class="subject-icon">${getSubjectIcon(subject.key)}</div>
                <h3 class="subject-name">
                    <span class="text-zh">${subject.name_zh}</span>
                    <span class="text-en">${subject.name_en}</span>
                </h3>
                <div class="subject-stats">
                    <span class="text-zh">点击开始</span>
                    <span class="text-en">Click to start</span>
                </div>
            `;

            card.addEventListener('click', () => {
                window.location.href = `subject.html?subject=${subject.key}`;
            });

            subjectsGrid.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading subjects:', error);
        loading.innerHTML = `
            <span class="text-zh">加载失败</span>
            <span class="text-en">Loading failed</span>
        `;
    }
}

// 获取科目图标
function getSubjectIcon(key) {
    const icons = {
        'bio': 'STAT',
        'blood': 'HEME',
        'chest': 'PULM',
        'cvs': 'CARD',
        'derma': 'DERM',
        'endo': 'ENDO',
        'ent': 'ENT',
        'ethics': 'ETH',
        'git': 'GI',
        'immunology': 'IMMU',
        'micro': 'MICR',
        'miscellanous': 'MISC',
        'neuro': 'NEUR',
        'neuro24': 'NEU24',
        'ophthalmology': 'OPHT',
        'pathology': 'PATH',
        'pharma': 'PHAR',
        'pregnancy': 'OBGY',
        'psychiatry': 'PSYC'
    };
    return icons[key] || 'SUBJ';
}

// 登出
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout | 登出失败');
    }
}

// 错题集
function reviewErrors() {
    if (!userStats || !userStats.studyHistory) {
        alert('No error history found | 暂无错题记录');
        return;
    }

    // 收集所有错题
    const errorQuestions = [];
    for (const [qid, data] of Object.entries(userStats.studyHistory)) {
        if (data.isError) {
            errorQuestions.push(qid);
        }
    }

    if (errorQuestions.length === 0) {
        alert('No errors found | 暂无错题');
        return;
    }

    // 跳转到错题模式
    window.location.href = `quiz.html?mode=errors`;
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    LanguageManager.init();

    // 检查认证状态
    currentUser = await checkAuthState();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // 显示用户信息
    document.getElementById('user-email').textContent = currentUser.email;

    // 加载用户数据
    await UserDataManager.loadUserData(currentUser.uid);

    // 显示科目
    await displaySubjects();

    // 事件监听
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('review-errors-btn').addEventListener('click', reviewErrors);
});
