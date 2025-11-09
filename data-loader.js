/**
 * 数据加载器
 * Data Loader for USMLE Question System
 *
 * 从GitHub加载JSON题目数据和exhibit图片
 * Loads question data and exhibit images from GitHub
 */

const DataLoader = {
    // GitHub raw content base URL (将在部署时配置)
    // GitHub raw content base URL (to be configured during deployment)
    // 格式: https://raw.githubusercontent.com/USERNAME/REPO/BRANCH/
    DATA_BASE_URL: 'https://raw.githubusercontent.com/gyshion/usmle_step1/main/',

    // 科目配置
    // Subject configuration
    SUBJECTS: [
        { key: 'bio', folderName: 'Bio & Statistics 23', name_en: 'Biostatistics & Epidemiology', name_zh: '生物统计学与流行病学' },
        { key: 'blood', folderName: 'Blood 23', name_en: 'Hematology', name_zh: '血液学' },
        { key: 'chest', folderName: 'Chest 23', name_en: 'Pulmonology', name_zh: '呼吸病学' },
        { key: 'cvs', folderName: 'CVS 23', name_en: 'Cardiology', name_zh: '心脏病学' },
        { key: 'derma', folderName: 'Derma 23', name_en: 'Dermatology', name_zh: '皮肤病学' },
        { key: 'endo', folderName: 'Endo 23', name_en: 'Endocrinology', name_zh: '内分泌学' },
        { key: 'ent', folderName: 'ENT 23', name_en: 'Otolaryngology', name_zh: '耳鼻喉科学' },
        { key: 'ethics', folderName: 'Ethics 23', name_en: 'Medical Ethics', name_zh: '医学伦理学' },
        { key: 'git', folderName: 'GIT 23', name_en: 'Gastroenterology', name_zh: '消化病学' },
        { key: 'immunology', folderName: 'Immunology 23', name_en: 'Immunology', name_zh: '免疫学' },
        { key: 'micro', folderName: 'Micro 23', name_en: 'Microbiology', name_zh: '微生物学' },
        { key: 'miscellanous', folderName: 'Miscellanous 23', name_en: 'Miscellaneous', name_zh: '其他' },
        { key: 'neuro', folderName: 'Neuro 23', name_en: 'Neurology', name_zh: '神经病学' },
        { key: 'neuro24', folderName: 'Neuro 24', name_en: 'Neurology 2024', name_zh: '神经病学 2024' },
        { key: 'ophthalmology', folderName: 'Ophthalmology 23', name_en: 'Ophthalmology', name_zh: '眼科学' },
        { key: 'pathology', folderName: 'Pathology 23', name_en: 'Pathology', name_zh: '病理学' },
        { key: 'pharma', folderName: 'Pharma 23', name_en: 'Pharmacology', name_zh: '药理学' },
        { key: 'pregnancy', folderName: 'Pregnancy 23', name_en: 'Obstetrics & Gynecology', name_zh: '妇产科学' },
        { key: 'psychiatry', folderName: 'Psychiatry 23', name_en: 'Psychiatry', name_zh: '精神病学' }
    ],

    // 缓存
    cache: {
        subjects: null,
        questionsBySubject: {}
    },

    /**
     * 初始化数据加载器
     * Initialize the data loader
     */
    async init() {
        if (this.cache.subjects) {
            return this.cache.subjects;
        }

        console.log('[DataLoader] Initializing...');
        this.cache.subjects = this.SUBJECTS;
        return this.cache.subjects;
    },

    /**
     * 加载指定科目的所有题目
     * Load all questions for a specific subject
     * @param {string} subjectKey - Subject key (e.g., 'cvs', 'blood')
     * @returns {Promise<Array>} Array of question objects
     */
    async loadSubject(subjectKey) {
        const subject = this.SUBJECTS.find(s => s.key === subjectKey);
        if (!subject) {
            throw new Error(`Subject not found: ${subjectKey}`);
        }

        // 返回缓存数据
        if (this.cache.questionsBySubject[subjectKey]) {
            console.log(`[DataLoader] Using cached data for ${subjectKey}`);
            return this.cache.questionsBySubject[subjectKey];
        }

        console.log(`[DataLoader] Loading subject: ${subjectKey} (${subject.folderName})`);

        try {
            // 首先加载index.json获取题目列表
            const indexUrl = this.getDataUrl(`data/${subject.folderName}/index.json`);
            const indexResponse = await fetch(indexUrl);

            if (!indexResponse.ok) {
                throw new Error(`Failed to load index: ${indexResponse.status}`);
            }

            const index = await indexResponse.json();
            const questionIds = index.questions || [];

            if (questionIds.length === 0) {
                console.warn(`[DataLoader] No questions found in index for ${subjectKey}`);
                return [];
            }

            console.log(`[DataLoader] Found ${questionIds.length} questions in index`);

            // 加载所有题目（并行）
            const questions = await Promise.all(
                questionIds.map(qid => this.loadQuestion(subject.folderName, qid))
            );

            // 过滤掉加载失败的题目
            const validQuestions = questions.filter(q => q !== null);

            console.log(`[DataLoader] Successfully loaded ${validQuestions.length}/${questionIds.length} questions`);

            // 缓存数据
            this.cache.questionsBySubject[subjectKey] = validQuestions;

            return validQuestions;

        } catch (error) {
            console.error(`[DataLoader] Error loading subject ${subjectKey}:`, error);
            throw error;
        }
    },

    /**
     * 加载单个题目
     * Load a single question
     * @param {string} folderName - Subject folder name
     * @param {string} questionId - Question ID
     * @returns {Promise<Object|null>} Question object or null if failed
     */
    async loadQuestion(folderName, questionId) {
        try {
            const url = this.getDataUrl(`data/${folderName}/${questionId}.json`);
            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`[DataLoader] Failed to load question ${questionId}: ${response.status}`);
                return null;
            }

            const question = await response.json();
            return question;

        } catch (error) {
            console.error(`[DataLoader] Error loading question ${questionId}:`, error);
            return null;
        }
    },

    /**
     * 获取数据文件URL
     * Get data file URL
     * @param {string} path - Relative path (e.g., 'data/CVS 23/980.json')
     * @returns {string} Full URL
     */
    getDataUrl(path) {
        return this.DATA_BASE_URL + encodeURI(path);
    },

    /**
     * 获取exhibit图片URL
     * Get exhibit image URL
     * @param {string} folderName - Subject folder name
     * @param {string} questionId - Question ID
     * @param {string} fileName - Image file name (e.g., 'image1.jpg')
     * @returns {string} Full URL to the image
     */
    getExhibitUrl(folderName, questionId, fileName) {
        // exhibits路径: exhibits/[Subject]/[QuestionID]/[FileName]
        const path = `exhibits/${folderName}/${questionId}/${fileName}`;
        return this.DATA_BASE_URL + encodeURI(path);
    }
};
