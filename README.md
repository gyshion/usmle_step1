# USMLE Step 1 Review System
# USMLE Step 1 复习系统

一个现代化的USMLE Step 1考试复习系统，支持中英文双语，包含题目练习、错题集、学习统计等功能。

A modern review system for USMLE Step 1 exam with bilingual support (English/Chinese), featuring practice questions, error collection, and study statistics.

## 功能特点 | Features

- **用户认证** | User Authentication (Firebase Auth)
  - 邮箱密码登录/注册
  - Google账号登录

- **题目练习** | Question Practice
  - 19个科目分类
  - 中英文双语题目
  - Exhibit图片展示
  - 答案解析

- **学习统计** | Study Statistics
  - 学习进度追踪
  - 错题记录
  - 掌握状态标记

- **错题集** | Error Collection
  - 自动收集错题
  - 错题复习模式

- **多语言支持** | Multi-language Support
  - 英文 (English)
  - 中文 (Chinese)
  - 双语对照 (Both)

## 技术栈 | Tech Stack

- **前端** | Frontend: HTML5, CSS3, JavaScript (Vanilla)
- **认证与数据库** | Auth & Database: Firebase (Authentication, Firestore)
- **数据托管** | Data Hosting: GitHub (JSON files & Images)
- **部署** | Deployment: Firebase Hosting

## 文件结构 | File Structure

```
online_system/
├── index.html          # 主页面 | Main page
├── login.html          # 登录页面 | Login page
├── subject.html        # 题目列表页面 | Question list page
├── quiz.html           # 做题页面 | Quiz page
├── styles.css          # 样式文件 | Styles
├── firebase-config.js  # Firebase配置 | Firebase config
├── auth.js            # 认证逻辑 | Authentication logic
├── app.js             # 主应用逻辑 | Main app logic
├── subject.js         # 题目列表逻辑 | Subject list logic
├── quiz.js            # 做题逻辑 | Quiz logic
├── data-loader.js     # 数据加载器 | Data loader
└── README.md          # 说明文档 | Documentation
```

## 部署步骤 | Deployment Steps

### 1. 准备数据文件 | Prepare Data Files

需要将题目JSON文件和exhibit图片上传到GitHub仓库：

```
GitHub仓库结构 | GitHub Repository Structure:
your-repo/
├── data/                    # JSON题目文件 | Question JSON files
│   ├── CVS 23/
│   │   ├── index.json      # 题目索引 | Question index
│   │   ├── 980.json
│   │   └── ...
│   ├── Blood 23/
│   └── ...
└── exhibits/                # Exhibit图片 | Exhibit images
    ├── CVS 23/
    │   ├── 980/
    │   │   └── image1.jpg
    │   └── ...
    └── ...
```

**创建index.json文件**：
每个科目文件夹需要一个`index.json`文件，格式如下：

```json
{
  "questions": ["980", "1014", "1040", ...]
}
```

### 2. 配置数据加载器 | Configure Data Loader

在 [data-loader.js](data-loader.js#L12) 中，更新 `DATA_BASE_URL` 为你的GitHub仓库地址：

```javascript
DATA_BASE_URL: 'https://raw.githubusercontent.com/YOUR-USERNAME/YOUR-REPO/main/'
```

### 3. Firebase配置 | Firebase Configuration

Firebase配置已在 [firebase-config.js](firebase-config.js) 中设置。如需使用新的Firebase项目：

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 创建新项目
3. 启用 Authentication (Email/Password 和 Google)
4. 创建 Firestore Database
5. 更新 `firebase-config.js` 中的配置信息

### 4. 部署到Firebase Hosting | Deploy to Firebase Hosting

```bash
# 安装Firebase CLI
npm install -g firebase-tools

# 登录Firebase
firebase login

# 初始化项目
firebase init hosting

# 部署
firebase deploy --only hosting
```

### 5. 本地测试 | Local Testing

使用Python启动本地服务器：

```bash
cd online_system
python -m http.server 8000
```

访问: http://localhost:8000/login.html

**注意**：本地测试时需要修改 `data-loader.js` 中的 `DATA_BASE_URL` 指向本地数据文件。

## 数据准备脚本 | Data Preparation Scripts

需要创建以下辅助脚本来准备数据：

### 1. 创建index.json

为每个科目创建题目索引：

```python
import os
import json

def create_index_files(translate_path, output_path):
    """为每个科目创建index.json文件"""
    for subject_folder in os.listdir(translate_path):
        subject_path = os.path.join(translate_path, subject_folder)
        if not os.path.isdir(subject_path):
            continue

        # 获取所有JSON文件（排除index.json）
        questions = []
        for file in os.listdir(subject_path):
            if file.endswith('.json') and file != 'index.json':
                qid = file.replace('.json', '')
                questions.append(qid)

        # 按数字排序
        questions.sort(key=lambda x: int(x) if x.isdigit() else x)

        # 创建index.json
        index_data = {'questions': questions}

        # 输出到目标路径
        output_subject_path = os.path.join(output_path, subject_folder)
        os.makedirs(output_subject_path, exist_ok=True)

        with open(os.path.join(output_subject_path, 'index.json'), 'w') as f:
            json.dump(index_data, f, indent=2)

        print(f'Created index for {subject_folder}: {len(questions)} questions')

# 使用示例
create_index_files(
    'C:\\Datas\\usmle\\step1\\translate',
    'C:\\Projects\\usmle_step1\\online_system\\data'
)
```

### 2. 复制exhibit图片

将exhibit图片从clip目录复制到exhibits目录：

```python
import os
import shutil

def copy_exhibits(clip_path, output_path):
    """复制exhibit图片文件"""
    for subject_folder in os.listdir(clip_path):
        subject_path = os.path.join(clip_path, subject_folder)
        if not os.path.isdir(subject_path):
            continue

        for qid_folder in os.listdir(subject_path):
            qid_path = os.path.join(subject_path, qid_folder)
            if not os.path.isdir(qid_path):
                continue

            # 创建输出目录
            output_qid_path = os.path.join(output_path, subject_folder, qid_folder)
            os.makedirs(output_qid_path, exist_ok=True)

            # 复制所有jpg文件
            for file in os.listdir(qid_path):
                if file.endswith('.jpg'):
                    src = os.path.join(qid_path, file)
                    dst = os.path.join(output_qid_path, file)
                    shutil.copy2(src, dst)

            print(f'Copied exhibits for {subject_folder}/{qid_folder}')

# 使用示例
copy_exhibits(
    'C:\\Datas\\usmle\\step1\\clip',
    'C:\\Projects\\usmle_step1\\online_system\\exhibits'
)
```

## 使用说明 | Usage

1. **注册/登录**: 使用邮箱密码或Google账号
2. **选择科目**: 在主页面选择要学习的科目
3. **做题**: 点击题目开始练习，查看exhibit图片，选择答案
4. **查看解析**: 选择答案后查看详细解析
5. **标记掌握状态**: 标记题目为"会了"或"还不会"
6. **错题复习**: 使用错题集功能复习错题

## 浏览器兼容性 | Browser Compatibility

- Chrome/Edge (推荐 | Recommended)
- Firefox
- Safari
- 需要支持ES6+ | Requires ES6+ support

## License

MIT License

## 联系方式 | Contact

如有问题或建议，请提交Issue。

For questions or suggestions, please submit an Issue.
