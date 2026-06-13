/**
 * 关卡页面主脚本
 * 负责题目加载、提示显示、答案验证等功能
 */

// ==================== 游戏数据 ====================
// 当前关卡数据（从QandA.md动态加载）
let currentLevelData = null;

// ==================== 全局状态 ====================
let currentLevel = 1;
let currentScore = 0;
const maxChances = 5;
let currentChances = maxChances;
let countdownTimer = null; // 倒计时定时器
let isLevelTransitioning = false; // 防止重复跳转
let nextLevelEnterHandler = null; // 下一关回车键处理器

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    initGame();
});

/**
 * 初始化游戏
 */
function initGame() {
    loadLevel(currentLevel);
    updateUI();

    // 绑定回车键提交
    document.getElementById('answer-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });
}

/**
 * 加载指定关卡
 * @param {number} levelId - 关卡ID
 */
async function loadLevel(levelId) {
    try {
        // 显示loading动画
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.remove('hidden');
        
        console.log('loadLevel: 尝试加载stage' + levelId);
        // 从QandA.md读取关卡数据
        const response = await fetch(`stage${levelId}/QandA.md`);
        console.log('loadLevel: 响应状态', response.ok, response.status);
        if (!response.ok) {
            throw new Error('关卡数据文件不存在');
        }
        
        const text = await response.text();
        
        // 解析QandA.md内容
        const lines = text.split('\n');
        let wordType = '';
        let descTop = '';
        let answer = '';
        
        for (const line of lines) {
            if (line.startsWith('1. 题目类型：')) {
                wordType = line.replace('1. 题目类型：', '').trim();
            } else if (line.startsWith('2. 图0注释：')) {
                descTop = line.replace('2. 图0注释：', '').trim();
            } else if (line.startsWith('3. 正确答案：')) {
                answer = line.replace('3. 正确答案：', '').trim();
            }
        }
        
        // 保存当前关卡数据
        currentLevelData = {
            id: levelId,
            wordType: wordType,
            descTop: descTop,
            answer: answer
        };
        
        // 设置描述文字
        document.getElementById('desc-top').textContent = '这是' + descTop;
        
        // 根据答案字数生成下划线，用空格分隔
        const answerLength = answer.length;
        const underscores = Array(answerLength).fill('_').join(' ');
        
        // 随机选择前缀
        const prefixes = [
            '脱口秀大王觉得这个是',
            '喜剧之王觉得这个是',
            '抽象圣体觉得这个是'
        ];
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        document.getElementById('desc-bottom').textContent = randomPrefix + ' ' + underscores;
        
        // 更新词语类型
        document.getElementById('word-type').textContent = '答案类型：' + (wordType || '未知类型');
        
        // 重置剩余次数
        currentChances = maxChances;
        updateChancesDisplay();
        
        // 清空输入框和反馈，启用输入
        const input = document.getElementById('answer-input');
        input.value = '';
        input.disabled = false;
        document.getElementById('submit-btn').disabled = false;
        showFeedback('');
        
        // 清空猜测历史
        document.getElementById('guess-history').innerHTML = '';
        
        // 等待图片加载完成
        const imageTop = document.getElementById('image-top');
        const imageBottom = document.getElementById('image-bottom');
        
        // 设置图片路径
        imageTop.src = `stage${levelId}/img0/000.jpg`;
        imageBottom.src = `stage${levelId}/img1/111.jpg`;
        
        // 等待两张图片都加载完成
        await Promise.all([
            new Promise((resolve) => {
                if (imageTop.complete) {
                    resolve();
                } else {
                    imageTop.onload = resolve;
                    imageTop.onerror = resolve; // 即使加载失败也继续
                }
            }),
            new Promise((resolve) => {
                if (imageBottom.complete) {
                    resolve();
                } else {
                    imageBottom.onload = resolve;
                    imageBottom.onerror = resolve; // 即使加载失败也继续
                }
            })
        ]);
        
        // 隐藏loading动画
        loadingOverlay.classList.add('hidden');
        
        // 自动聚焦输入框
        input.focus();
        
    } catch (error) {
        console.error('加载关卡失败:', error);
        showFeedback('关卡加载失败，请检查文件路径', 'error');
        // 隐藏loading动画
        document.getElementById('loading-overlay').classList.add('hidden');
    }
}

/**
 * 更新剩余次数显示
 */
function updateChancesDisplay() {
    const icons = document.querySelectorAll('.chance-icon');
    icons.forEach((icon, index) => {
        if (index < currentChances) {
            icon.classList.remove('used');
        } else {
            icon.classList.add('used');
        }
    });
}

/**
 * 添加猜测记录
 * @param {string} userAnswer - 用户输入的答案
 * @param {string} correctAnswer - 正确答案
 */
function addGuessToHistory(userAnswer, correctAnswer) {
    const historyContainer = document.getElementById('guess-history');
    const row = document.createElement('div');
    row.className = 'guess-row';
    
    // 逐字比较
    for (let i = 0; i < userAnswer.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'guess-cell';
        cell.textContent = userAnswer[i];
        
        // 判断该字是否正确
        if (i < correctAnswer.length && userAnswer[i] === correctAnswer[i]) {
            cell.classList.add('correct');
        } else {
            cell.classList.add('wrong');
        }
        
        row.appendChild(cell);
    }
    
    historyContainer.appendChild(row);
    
    // 滚动到底部
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

/**
 * 提交答案
 */
function submitAnswer() {
    const input = document.getElementById('answer-input');
    const userAnswer = input.value.trim();

    if (!userAnswer) {
        showFeedback('请输入答案后再提交', 'error');
        return;
    }

    if (!currentLevelData) {
        showFeedback('关卡数据未加载', 'error');
        return;
    }

    // 检查答案位数是否一致
    if (userAnswer.length !== currentLevelData.answer.length) {
        showFeedback('答案应为' + currentLevelData.answer.length + '个字', 'error');
        return;
    }

    // 添加猜测记录
    addGuessToHistory(userAnswer, currentLevelData.answer);

    // 验证答案
    const isCorrect = checkAnswer(userAnswer, currentLevelData.answer);

    // 无论对错都扣一次心
    currentChances--;
    updateChancesDisplay();

    if (isCorrect) {
        showFeedback('回答正确！', 'success');
        currentScore += 10;
        updateUI();

        // 禁用输入
        input.disabled = true;
        document.getElementById('submit-btn').disabled = true;

        // 显示下一关区域并开始倒计时
        showNextLevelArea();
    } else {
        if (currentChances <= 0) {
            showFeedback('次数用完，正确答案是：' + currentLevelData.answer, 'error');
            input.disabled = true;
            document.getElementById('submit-btn').disabled = true;

            // 显示下一关区域并开始倒计时
            showNextLevelArea();
        } else {
            showFeedback('回答错误，请再想想', 'error');
        }
    }
}

/**
 * 检查答案是否正确
 * @param {string} userAnswer - 用户输入
 * @param {string|Array} correctAnswer - 正确答案
 * @returns {boolean}
 */
function checkAnswer(userAnswer, correctAnswer) {
    const normalized = userAnswer.toLowerCase().replace(/\s+/g, '');

    if (Array.isArray(correctAnswer)) {
        return correctAnswer.some(ans =>
            ans.toLowerCase().replace(/\s+/g, '') === normalized
        );
    }

    return correctAnswer.toLowerCase().replace(/\s+/g, '') === normalized;
}

/**
 * 显示反馈信息
 * @param {string} message - 信息内容
 * @param {string} type - 类型: 'success' | 'error' | ''
 */
function showFeedback(message, type = '') {
    const feedbackEl = document.getElementById('feedback-message');
    feedbackEl.textContent = message;
    feedbackEl.className = 'feedback-message' + (type ? ' ' + type : '');
}

/**
 * 更新UI显示
 */
function updateUI() {
    document.getElementById('current-level').textContent = currentLevel;
    // score元素可能不存在，安全处理
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
        scoreEl.textContent = currentScore;
    }
}

/**
 * 显示下一关区域并开始倒计时
 */
function showNextLevelArea() {
    const nextLevelArea = document.getElementById('next-level-area');
    const countdownEl = document.getElementById('countdown');
    
    // 显示下一关区域
    nextLevelArea.style.display = 'block';
    
    // 添加回车键监听器
    nextLevelEnterHandler = function(e) {
        if (e.key === 'Enter') {
            nextLevel();
        }
    };
    document.addEventListener('keydown', nextLevelEnterHandler);
    
    // 开始倒计时
    let seconds = 10;
    countdownEl.textContent = seconds;
    
    countdownTimer = setInterval(() => {
        seconds--;
        countdownEl.textContent = seconds;
        
        if (seconds <= 0) {
            // 倒计时结束，自动进入下一关
            clearInterval(countdownTimer);
            nextLevel();
        }
    }, 1000);
}

/**
 * 进入下一关
 */
async function nextLevel() {
    // 防止重复调用
    if (isLevelTransitioning) {
        return;
    }
    isLevelTransitioning = true;
    
    // 清除倒计时定时器
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    
    // 移除回车键监听器
    if (nextLevelEnterHandler) {
        document.removeEventListener('keydown', nextLevelEnterHandler);
        nextLevelEnterHandler = null;
    }
    
    // 隐藏下一关区域
    document.getElementById('next-level-area').style.display = 'none';
    
    try {
        const nextStageUrl = `stage${currentLevel + 1}/QandA.md`;
        console.log('尝试加载下一关，当前关卡:', currentLevel, '检查URL:', nextStageUrl);
        console.log('完整URL:', new URL(nextStageUrl, window.location.href).href);
        // 尝试加载下一关
        const response = await fetch(nextStageUrl);
        console.log('响应状态:', response.ok, response.status, response.statusText);
        if (response.ok) {
            currentLevel++;
            console.log('成功进入第', currentLevel, '关');
            await loadLevel(currentLevel);
            updateUI();
        } else {
            console.log('没有更多关卡了');
            showCompletionModal();
        }
    } catch (error) {
        console.error('加载下一关失败:', error);
        showCompletionModal();
    } finally {
        isLevelTransitioning = false;
    }
}

/**
 * 显示完成所有关卡的弹窗
 */
function showCompletionModal() {
    document.getElementById('modal-overlay').classList.add('active');
}

/**
 * 返回主页
 */
function goBack() {
    // 如果在iframe中，通知父页面关闭
    if (window.parent !== window) {
        window.parent.postMessage('closeStages', '*');
    } else {
        // 直接访问的情况
        window.location.href = '../index.html';
    }
}

/**
 * 切换音乐状态
 */
function toggleMusic() {
    const musicBtn = document.getElementById('music-btn');
    musicBtn.classList.toggle('muted');
    
    // 暂时没有实际音效，只切换图标状态
    // 未来可以在这里添加音效控制逻辑
}
