// 题目列表页面逻辑
// Subject List Page Logic

let currentUser = null;
let userHistory = {};
let currentSubject = null;
let questions = [];
let sortState = { column: null, ascending: true };

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

// 获取URL参数
function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// 加载题目
async function loadQuestions() {
    const subjectKey = getUrlParam('subject');
    if (!subjectKey) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // 获取科目信息
        const subjects = await DataLoader.init();
        currentSubject = subjects.find(s => s.key === subjectKey);

        if (!currentSubject) {
            throw new Error('Subject not found');
        }

        // 更新标题
        updateTitle();

        // 加载题目数据
        questions = await DataLoader.loadSubject(subjectKey);

        if (questions.length === 0) {
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('empty-state').classList.remove('hidden');
            return;
        }

        // 加载用户历史
        await loadUserHistory();

        // 显示题目
        displayQuestions();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('table-container').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('loading').innerHTML = `
            <p class="error">
                <span class="text-zh">加载失败: ${error.message}</span>
                <span class="text-en">Loading failed: ${error.message}</span>
            </p>
        `;
    }
}

// 更新标题
function updateTitle() {
    const titleEl = document.getElementById('subject-title');
    titleEl.innerHTML = `
        <span class="text-zh">${currentSubject.name_zh}</span>
        <span class="text-en">${currentSubject.name_en}</span>
    `;
}

// 加载用户历史
async function loadUserHistory() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            userHistory = userDoc.data().studyHistory || {};
        }
    } catch (error) {
        console.error('Error loading user history:', error);
    }
}

// 显示题目
function displayQuestions() {
    const tbody = document.getElementById('question-tbody');
    tbody.innerHTML = '';

    // 计算错题数
    let errorCount = 0;

    questions.forEach(q => {
        const qid = `${currentSubject.key}_${q.question_id}`;
        const history = userHistory[qid] || {};
        const isError = history.isError || false;
        const isMastered = history.isMastered || false;
        const lastStudied = history.lastStudied ? new Date(history.lastStudied) : null;

        if (isError) errorCount++;

        // 计算天数
        let days = '-';
        if (lastStudied) {
            const diff = Date.now() - lastStudied.getTime();
            days = Math.floor(diff / (1000 * 60 * 60 * 24));
        }

        // 状态
        let status = '未学习';
        let statusClass = 'status-new';
        if (isMastered) {
            status = '已掌握';
            statusClass = 'status-mastered';
        } else if (isError) {
            status = '错题';
            statusClass = 'status-error';
        } else if (lastStudied) {
            status = '已学习';
            statusClass = 'status-studied';
        }

        const row = document.createElement('tr');
        row.className = statusClass;
        row.innerHTML = `
            <td>${days}</td>
            <td>${q.question_id}</td>
            <td><span class="status-badge">${status}</span></td>
            <td class="tags-cell">${formatTags(q.tags)}</td>
        `;

        row.addEventListener('click', () => {
            window.location.href = `quiz.html?subject=${currentSubject.key}&question=${q.question_id}`;
        });

        tbody.appendChild(row);
    });

    // 更新错题计数
    document.getElementById('error-count').textContent = errorCount;
}

// 格式化标签
function formatTags(tags) {
    if (!tags) return '';

    // 处理不同类型的tags
    let tagArray;
    if (Array.isArray(tags)) {
        // tags已经是数组
        tagArray = tags;
    } else if (typeof tags === 'string') {
        // tags是字符串，需要分割
        tagArray = tags.split(';').map(t => t.trim()).filter(t => t);
    } else {
        // tags是其他类型，返回空
        return '';
    }

    return tagArray.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join(' ');
}

// 排序
function sortQuestions(column) {
    if (sortState.column === column) {
        sortState.ascending = !sortState.ascending;
    } else {
        sortState.column = column;
        sortState.ascending = true;
    }

    questions.sort((a, b) => {
        let aVal, bVal;

        if (column === 'id') {
            aVal = parseInt(a.question_id);
            bVal = parseInt(b.question_id);
        } else if (column === 'status') {
            const aHistory = userHistory[`${currentSubject.key}_${a.question_id}`] || {};
            const bHistory = userHistory[`${currentSubject.key}_${b.question_id}`] || {};
            aVal = getStatusValue(aHistory);
            bVal = getStatusValue(bHistory);
        } else if (column === 'days') {
            const aHistory = userHistory[`${currentSubject.key}_${a.question_id}`] || {};
            const bHistory = userHistory[`${currentSubject.key}_${b.question_id}`] || {};
            aVal = aHistory.lastStudied ? Date.now() - new Date(aHistory.lastStudied).getTime() : Infinity;
            bVal = bHistory.lastStudied ? Date.now() - new Date(bHistory.lastStudied).getTime() : Infinity;
        }

        if (sortState.ascending) {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    displayQuestions();
    updateSortIndicators();
}

// 获取状态值（用于排序）
function getStatusValue(history) {
    if (history.isMastered) return 3;
    if (history.isError) return 1;
    if (history.lastStudied) return 2;
    return 0;
}

// 更新排序指示器
function updateSortIndicators() {
    document.querySelectorAll('.sortable').forEach(th => {
        const indicator = th.querySelector('.sort-indicator');
        if (th.dataset.sort === sortState.column) {
            indicator.textContent = sortState.ascending ? '↑' : '↓';
        } else {
            indicator.textContent = '';
        }
    });
}

// 随机打乱
function shuffleQuestions() {
    questions.sort(() => Math.random() - 0.5);
    displayQuestions();
    sortState = { column: null, ascending: true };
    updateSortIndicators();
}

// 查看错题
function viewErrors() {
    window.location.href = `quiz.html?subject=${currentSubject.key}&mode=errors`;
}

// 登出
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    LanguageManager.init();

    // 检查认证
    currentUser = await checkAuthState();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // 加载题目
    await loadQuestions();

    // 事件监听
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('shuffle-btn').addEventListener('click', shuffleQuestions);
    document.getElementById('errors-btn').addEventListener('click', viewErrors);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // 排序事件
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            sortQuestions(th.dataset.sort);
        });
    });
});
