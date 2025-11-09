@echo off
echo ========================================
echo Git Upload Guide
echo GitHub上传指南
echo ========================================
echo.
echo 步骤1: 初始化Git仓库
echo Step 1: Initialize Git repository
echo.
pause

git init
if errorlevel 1 (
    echo Git初始化失败！请确保已安装Git
    echo Git init failed! Please make sure Git is installed
    pause
    exit /b 1
)

echo.
echo ========================================
echo 步骤2: 添加所有文件
echo Step 2: Add all files
echo ========================================
echo.
echo 正在添加文件（这可能需要几分钟）...
echo Adding files (this may take a few minutes)...
echo.

git add .
if errorlevel 1 (
    echo 添加文件失败！
    echo Failed to add files!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 文件添加成功！检查状态：
echo Files added successfully! Checking status:
echo ========================================
echo.

git status -s | head -20
echo.
echo ... (更多文件) / (more files) ...
echo.

echo ========================================
echo 步骤3: 创建提交
echo Step 3: Create commit
echo ========================================
echo.
pause

git commit -m "Add USMLE Step 1 data and exhibits"
if errorlevel 1 (
    echo 提交失败！
    echo Commit failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 步骤4: 添加远程仓库
echo Step 4: Add remote repository
echo ========================================
echo.
echo 请在GitHub创建一个新仓库，然后输入仓库URL
echo Please create a new repository on GitHub, then enter the repository URL
echo.
echo 格式示例 / Example format:
echo https://github.com/YOUR-USERNAME/YOUR-REPO.git
echo.
set /p REPO_URL="请输入仓库URL / Enter repository URL: "

git remote add origin %REPO_URL%
if errorlevel 1 (
    echo 添加远程仓库失败！
    echo Failed to add remote repository!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 步骤5: 推送到GitHub
echo Step 5: Push to GitHub
echo ========================================
echo.
echo 正在推送（这可能需要较长时间，请耐心等待）...
echo Pushing (this may take a while, please be patient)...
echo.
pause

git push -u origin main
if errorlevel 1 (
    echo.
    echo 如果推送失败，可能需要：
    echo If push failed, you may need to:
    echo 1. 设置分支名为main: git branch -M main
    echo 2. 检查GitHub认证
    echo 3. 使用强制推送（谨慎）: git push -u origin main --force
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo 上传完成！
echo Upload completed!
echo ========================================
echo.
echo 下一步：
echo Next steps:
echo 1. 编辑 data-loader.js 第12行，更新GitHub URL
echo    Edit data-loader.js line 12, update GitHub URL
echo 2. 运行: firebase deploy --only hosting
echo    Run: firebase deploy --only hosting
echo.
pause
