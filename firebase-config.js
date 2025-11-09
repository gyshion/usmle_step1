// Firebase 配置
// Firebase Configuration
// 使用兼容模式 SDK (compat)

const firebaseConfig = {
    apiKey: "AIzaSyDfzz6Cxz5PFynXWNrjBTu11gfLf8D0lcg",
    authDomain: "usmle-step1-7507b.firebaseapp.com",
    projectId: "usmle-step1-7507b",
    storageBucket: "usmle-step1-7507b.firebasestorage.app",
    messagingSenderId: "336448498075",
    appId: "1:336448498075:web:a05e75e5b386e4dd99593e",
    measurementId: "G-WJTM5KEYR6"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);

// Firebase 服务
const auth = firebase.auth();
const db = firebase.firestore();

// 检查用户认证状态
function checkAuthState() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            resolve(user);
        });
    });
}
