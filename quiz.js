// 做题页面逻辑
// Quiz Page Logic

let currentUser = null;
let currentSubject = null;
let questions = [];
let currentIndex = 0;
let userAnswer = null;
let answered = false;

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

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    },

    attachEventListeners() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyLanguage(btn.dataset.lang);
                // 重新渲染当前题目以应用新语言
                if (questions.length > 0) {
                    displayQuestion();
                }
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
    const questionId = getUrlParam('question');
    const mode = getUrlParam('mode');

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

        // 加载所有题目
        const allQuestions = await DataLoader.loadSubject(subjectKey);

        if (allQuestions.length === 0) {
            throw new Error('No questions found');
        }

        // 根据模式筛选题目
        if (mode === 'errors') {
            // 错题模式：只显示错题
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            const userHistory = userDoc.exists ? (userDoc.data().studyHistory || {}) : {};

            questions = allQuestions.filter(q => {
                const qid = `${subjectKey}_${q.question_id}`;
                return userHistory[qid] && userHistory[qid].isError;
            });

            if (questions.length === 0) {
                alert('No errors found | 暂无错题');
                window.history.back();
                return;
            }
        } else if (questionId) {
            // 从subject页面传递的题目列表
            const questionListStr = sessionStorage.getItem('questionList');
            const storedSubject = sessionStorage.getItem('currentSubject');

            if (questionListStr && storedSubject === subjectKey) {
                // 使用传递的题目顺序
                const questionList = JSON.parse(questionListStr);
                questions = questionList.map(qid =>
                    allQuestions.find(q => q.question_id === qid)
                ).filter(q => q !== undefined);

                // 找到当前题目的索引
                currentIndex = questions.findIndex(q => q.question_id === questionId);
                if (currentIndex === -1) currentIndex = 0;
            } else {
                // 单题模式（如果没有列表）
                const question = allQuestions.find(q => q.question_id === questionId);
                if (question) {
                    questions = [question];
                    currentIndex = 0;
                } else {
                    throw new Error('Question not found');
                }
            }
        } else {
            // 全部题目模式
            questions = allQuestions;
        }

        // 显示当前题
        displayQuestion();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('quiz-card').classList.remove('hidden');

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

// 显示题目
function displayQuestion() {
    const q = questions[currentIndex];
    const lang = LanguageManager.currentLang;

    // 重置状态
    answered = false;
    userAnswer = null;
    document.getElementById('answer-section').classList.add('hidden');

    // 更新进度
    document.getElementById('question-progress').textContent = `Question ${currentIndex + 1} of ${questions.length}`;
    document.getElementById('question-id').textContent = `Q#${q.question_id}`;

    // 题干（处理exhibit占位符）
    let stemText = getText(q.question_stem, lang);
    stemText = processExhibits(stemText, q);
    document.getElementById('question-stem').innerHTML = stemText;

    // 问题
    document.getElementById('question-text').innerHTML = getText(q.question, lang);

    // 选项
    displayOptions(q);
}

// 处理exhibit占位符
function processExhibits(text, question) {
    if (!question.has_exhibits || !question.exhibit_files) {
        return text;
    }

    // 替换{{exhibit_1}}, {{exhibit_2}}等
    question.exhibit_files.forEach((file, index) => {
        const placeholder = `{{exhibit_${index + 1}}}`;
        const exhibitUrl = DataLoader.getExhibitUrl(currentSubject.folderName, question.question_id, file);

        const exhibitHtml = `
            <div class="exhibit-inline" data-exhibit="${exhibitUrl}">
                <img src="${exhibitUrl}" alt="Exhibit ${index + 1}" class="exhibit-thumbnail">
                <div class="exhibit-label">
                    <span class="text-zh">点击查看大图</span>
                    <span class="text-en">Click to enlarge</span>
                </div>
            </div>
        `;

        text = text.replace(placeholder, exhibitHtml);
    });

    return text;
}

// 获取文本（根据语言）
function getText(obj, lang) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;

    if (lang === 'zh') {
        return obj.zh || obj.en || '';
    } else if (lang === 'en') {
        return obj.en || obj.zh || '';
    } else { // both
        return `<div class="text-zh">${obj.zh || ''}</div><div class="text-en">${obj.en || ''}</div>`;
    }
}

// 格式化解析文本（分段显示）
function formatExplanation(text) {
    if (!text) return '';

    // 按照双换行符分段
    let paragraphs = text.split('\n\n');

    // 如果没有双换行符，尝试按单换行符分段
    if (paragraphs.length === 1) {
        paragraphs = text.split('\n');
    }

    // 过滤掉空段落并添加段落标签
    paragraphs = paragraphs
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => `<p>${p}</p>`);

    return paragraphs.join('');
}

// 显示选项
function displayOptions(q) {
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    const options = ['A', 'B', 'C', 'D', 'E'];
    const lang = LanguageManager.currentLang;

    options.forEach(opt => {
        if (!q.options[opt]) return;

        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.dataset.option = opt;

        const optionText = getText(q.options[opt], lang);
        optionDiv.innerHTML = `
            <div class="option-label">${opt}</div>
            <div class="option-text">${optionText}</div>
        `;

        optionDiv.addEventListener('click', () => handleOptionClick(opt));

        container.appendChild(optionDiv);
    });
}

// 处理选项点击
function handleOptionClick(option) {
    if (answered) return;

    const q = questions[currentIndex];

    // 移除之前的选择
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // 标记当前选择
    document.querySelector(`[data-option="${option}"]`).classList.add('selected');
    userAnswer = option;

    // 显示答案
    showAnswer(option === q.correct_answer);
}

// 显示答案和解析
function showAnswer(isCorrect) {
    answered = true;
    const q = questions[currentIndex];
    const lang = LanguageManager.currentLang;

    // 标记正确/错误
    document.querySelectorAll('.option').forEach(opt => {
        if (opt.dataset.option === q.correct_answer) {
            opt.classList.add('correct');
        }
        if (opt.dataset.option === userAnswer && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });

    // 显示正确答案
    const correctText = getText(q.options[q.correct_answer], lang);
    document.getElementById('correct-answer-text').innerHTML = `<strong>${q.correct_answer}</strong>: ${correctText}`;

    // 显示解析（处理exhibit和分段）
    let explanationText = getText(q.explanation, lang);
    explanationText = processExhibits(explanationText, q);
    explanationText = formatExplanation(explanationText);
    document.getElementById('explanation-text').innerHTML = explanationText;

    // 显示答案区域
    document.getElementById('answer-section').classList.remove('hidden');

    // 保存学习记录
    saveStudyRecord(isCorrect);
}

// 保存学习记录
async function saveStudyRecord(isCorrect) {
    const q = questions[currentIndex];
    const qid = `${currentSubject.key}_${q.question_id}`;

    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const updateData = {};

        updateData[`studyHistory.${qid}`] = {
            lastStudied: new Date().toISOString(),
            isCorrect: isCorrect,
            isError: !isCorrect,
            isMastered: false
        };

        // 更新统计
        if (isCorrect) {
            updateData['stats.totalStudied'] = firebase.firestore.FieldValue.increment(1);
        } else {
            updateData['stats.totalErrors'] = firebase.firestore.FieldValue.increment(1);
        }

        await userRef.update(updateData);

    } catch (error) {
        console.error('Error saving study record:', error);
    }
}

// 标记为已掌握
async function markAsMastered(mastered) {
    const q = questions[currentIndex];
    const qid = `${currentSubject.key}_${q.question_id}`;

    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const updateData = {};

        updateData[`studyHistory.${qid}.isMastered`] = mastered;

        if (mastered) {
            updateData[`studyHistory.${qid}.isError`] = false;
            updateData['stats.totalMastered'] = firebase.firestore.FieldValue.increment(1);
        }

        await userRef.update(updateData);

        // 视觉反馈
        if (mastered) {
            document.getElementById('mastered-btn').classList.add('active');
            document.getElementById('not-mastered-btn').classList.remove('active');
        } else {
            document.getElementById('not-mastered-btn').classList.add('active');
            document.getElementById('mastered-btn').classList.remove('active');
        }

    } catch (error) {
        console.error('Error updating mastery:', error);
    }
}

// 下一题
function nextQuestion() {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        displayQuestion();
        updateNavigationButtons();
        window.scrollTo(0, 0);
    } else {
        // 已完成所有题目
        if (confirm('已完成所有题目！返回题目列表？\nAll questions completed! Back to question list?')) {
            window.history.back();
        }
    }
}

// 上一题
function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        displayQuestion();
        updateNavigationButtons();
        window.scrollTo(0, 0);
    }
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // 如果是第一题，禁用上一题按钮
    if (currentIndex === 0) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.5';
        prevBtn.style.cursor = 'not-allowed';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = '1';
        prevBtn.style.cursor = 'pointer';
    }

    // 如果是最后一题，更新下一题按钮文字
    if (currentIndex === questions.length - 1) {
        nextBtn.innerHTML = `
            <span class="text-zh">返回列表</span>
            <span class="text-en">Back to List</span>
        `;
    } else {
        nextBtn.innerHTML = `
            <span class="text-zh">下一题 →</span>
            <span class="text-en">Next →</span>
        `;
    }
}

// Exhibit 模态框
function setupExhibitModal() {
    document.addEventListener('click', (e) => {
        const exhibitEl = e.target.closest('.exhibit-inline');
        if (exhibitEl) {
            const url = exhibitEl.dataset.exhibit;
            showExhibitModal(url);
        }
    });

    document.getElementById('close-exhibit').addEventListener('click', hideExhibitModal);
    document.getElementById('exhibit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'exhibit-modal') {
            hideExhibitModal();
        }
    });
}

function showExhibitModal(url) {
    document.getElementById('exhibit-image').src = url;
    document.getElementById('exhibit-modal').classList.remove('hidden');
}

function hideExhibitModal() {
    document.getElementById('exhibit-modal').classList.add('hidden');
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

    // 设置exhibit模态框
    setupExhibitModal();

    // 事件监听
    document.getElementById('back-btn').addEventListener('click', () => {
        window.history.back();
    });

    document.getElementById('mastered-btn').addEventListener('click', () => markAsMastered(true));
    document.getElementById('not-mastered-btn').addEventListener('click', () => markAsMastered(false));
    document.getElementById('prev-btn').addEventListener('click', prevQuestion);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);

    // 初始化导航按钮状态
    updateNavigationButtons();
});
