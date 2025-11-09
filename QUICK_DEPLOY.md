# 快速部署指南 | Quick Deployment Guide

## 当前状态 | Current Status

✅ 数据已准备完成
- 3,211道题目 (JSON files)
- 6,280张图片 (Exhibit images)
- 数据大小: ~214 MB

## 部署步骤 | Deployment Steps

### 方法1: 使用辅助脚本 (推荐)

```bash
# 在online_system目录下双击运行
git_upload_guide.bat
```

脚本会自动引导你完成所有步骤。

### 方法2: 手动执行

#### 1. 初始化Git仓库

```bash
cd online_system
git init
```

#### 2. 添加文件

```bash
git add .
```

**注意**: 添加文件可能需要几分钟，请耐心等待。

#### 3. 创建提交

```bash
git commit -m "Add USMLE Step 1 data and exhibits"
```

#### 4. 在GitHub创建仓库

1. 访问 https://github.com/new
2. 仓库名建议: `usmle_step1` 或 `usmle-step1-data`
3. 选择 Public (公开) - 这样才能用GitHub raw URL访问
4. 不要初始化README (我们已有文件)
5. 点击 Create repository

#### 5. 关联远程仓库

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
```

将 `YOUR-USERNAME` 和 `YOUR-REPO` 替换为你的用户名和仓库名。

#### 6. 推送到GitHub

```bash
git branch -M main
git push -u origin main
```

**注意**:
- 推送可能需要10-30分钟（取决于网络速度）
- 如果文件太大导致推送失败，可以考虑使用Git LFS

#### 7. 配置数据加载器

编辑 `data-loader.js` 第12行：

```javascript
DATA_BASE_URL: 'https://raw.githubusercontent.com/YOUR-USERNAME/YOUR-REPO/main/'
```

例如：
```javascript
DATA_BASE_URL: 'https://raw.githubusercontent.com/gyshion/usmle_step1/main/'
```

#### 8. 部署到Firebase

```bash
firebase login
firebase deploy --only hosting
```

## 验证部署 | Verify Deployment

### 1. 检查GitHub

访问你的仓库，确认文件已上传：
- `data/` 文件夹存在
- `exhibits/` 文件夹存在
- 所有19个科目文件夹都在

### 2. 测试数据URL

在浏览器中测试一个URL（替换为你的用户名和仓库名）：

```
https://raw.githubusercontent.com/YOUR-USERNAME/YOUR-REPO/main/data/CVS%2023/index.json
```

应该能看到JSON数据。

### 3. 测试应用

访问Firebase部署的URL，测试：
- 登录/注册功能
- 选择科目
- 查看题目列表
- 做题功能
- Exhibit图片加载

## 常见问题 | Troubleshooting

### 推送失败: "file size exceeds GitHub's limit"

**原因**: 某些exhibit图片可能超过100MB

**解决方案1**: 使用Git LFS
```bash
git lfs install
git lfs track "*.jpg"
git lfs track "*.png"
git add .gitattributes
git commit -m "Add Git LFS"
git push -u origin main
```

**解决方案2**: 分批推送
```bash
# 先推送应用代码和JSON
git add *.html *.js *.css *.json data/
git commit -m "Add app code and question data"
git push -u origin main

# 再推送exhibits
git add exhibits/
git commit -m "Add exhibit images"
git push
```

### 图片加载失败

1. 检查GitHub URL是否正确
2. 确认仓库是Public（公开）
3. 检查路径中的空格是否正确编码（`%20`）
4. 查看浏览器控制台的Network tab

### Firebase部署失败

1. 检查是否已登录: `firebase login`
2. 检查项目配置: `firebase projects:list`
3. 确认`.firebaserc`中的项目ID正确

## 性能优化建议 | Performance Tips

### 1. 使用CDN加速

考虑使用CDN服务（如Cloudflare）来加速GitHub raw内容访问。

### 2. 压缩图片

如果加载速度慢，可以考虑：
- 压缩exhibit图片（使用TinyPNG等工具）
- 转换为WebP格式

### 3. 实现缓存

在`data-loader.js`中实现更积极的缓存策略。

## 文件大小参考 | File Size Reference

```
online_system/
├── 应用代码 (App code): ~100 KB
├── data/ (JSON): ~50 MB
└── exhibits/ (Images): ~214 MB
总计 (Total): ~264 MB
```

## 下一步 | Next Steps

部署完成后：
1. 测试所有功能
2. 收集用户反馈
3. 根据需要优化性能
4. 添加更多功能（搜索、笔记等）

---

**需要帮助?**
- 查看 [README.md](README.md)
- 查看 [DEPLOY_GUIDE.md](../DEPLOY_GUIDE.md)
- 在GitHub仓库提交Issue
