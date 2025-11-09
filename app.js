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
        const studyHistory = userStats.studyHistory || {};
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // 本周周日
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); // 本月第一天

        let countToday = 0;
        let countWeek = 0;
        let countMonth = 0;
        let countTotal = 0;

        const dailyActivity = {}; // 用于热力图

        for (const [qid, data] of Object.entries(studyHistory)) {
            if (!data.lastStudied) continue;

            const studyDate = new Date(data.lastStudied);
            const studyDay = new Date(studyDate.getFullYear(), studyDate.getMonth(), studyDate.getDate());
            const dayKey = studyDay.toISOString().split('T')[0];

            // 计数每天的活动
            dailyActivity[dayKey] = (dailyActivity[dayKey] || 0) + 1;

            countTotal++;
            if (studyDay >= today) countToday++;
            if (studyDay >= weekStart) countWeek++;
            if (studyDay >= monthStart) countMonth++;
        }

        document.getElementById('stat-today').textContent = countToday;
        document.getElementById('stat-week').textContent = countWeek;
        document.getElementById('stat-month').textContent = countMonth;
        document.getElementById('stat-total').textContent = countTotal;

        // 生成热力图
        this.generateHeatmap(dailyActivity);
    },

    generateHeatmap(dailyActivity) {
        const container = document.getElementById('heatmap-container');
        container.innerHTML = '';

        // 生成最近12周的热力图
        const weeks = 12;
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - weeks * 7);

        // 找到最大值用于颜色分级
        const maxCount = Math.max(...Object.values(dailyActivity), 1);

        // 生成周
        for (let week = 0; week < weeks; week++) {
            const weekDiv = document.createElement('div');
            weekDiv.className = 'heatmap-week';

            // 生成7天
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + week * 7 + day);

                const dayKey = currentDate.toISOString().split('T')[0];
                const count = dailyActivity[dayKey] || 0;

                const dayDiv = document.createElement('div');
                dayDiv.className = 'heatmap-day';
                dayDiv.dataset.date = dayKey;
                dayDiv.dataset.count = count;

                // 计算颜色等级 (0-4)
                let level = 0;
                if (count > 0) {
                    level = Math.min(4, Math.ceil((count / maxCount) * 4));
                }
                dayDiv.dataset.level = level;

                // 工具提示
                dayDiv.title = `${dayKey}: ${count} questions`;

                weekDiv.appendChild(dayDiv);
            }

            container.appendChild(weekDiv);
        }
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
});
