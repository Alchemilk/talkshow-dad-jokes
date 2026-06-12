// 趣味猜词游戏入口页面脚本

document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const mainContent = document.querySelector('.main-content');
    const stagesContainer = document.getElementById('stagesContainer');
    const stagesFrame = document.getElementById('stagesFrame');
    
    // 开始游戏按钮点击事件
    startBtn.addEventListener('click', function() {
        // 添加点击动画效果
        this.style.transform = 'translateY(4px) scale(0.98)';
        
        setTimeout(() => {
            this.style.transform = '';
            
            // 主内容区淡出
            mainContent.classList.add('fade-out');
            
            // 加载关卡页面
            stagesFrame.src = 'stages/stages.html';
            
            // 显示关卡容器
            setTimeout(() => {
                stagesContainer.classList.add('active');
            }, 300);
        }, 150);
    });
    
    // 添加按钮悬停音效（可选）
    startBtn.addEventListener('mouseenter', function() {
        // 可以在这里添加音效
        this.style.filter = 'brightness(1.1)';
    });
    
    startBtn.addEventListener('mouseleave', function() {
        this.style.filter = '';
    });
    
    // 标题动画触发
    const title = document.querySelector('.title-text');
    
    // 随机添加一些装饰性的闪烁效果
    setInterval(() => {
        createSparkle();
    }, 2000);
    
    // 监听来自关卡页面的消息
    window.addEventListener('message', function(event) {
        if (event.data === 'closeStages') {
            closeStages();
        }
    });
});

// 关闭关卡页面，返回首页
function closeStages() {
    const mainContent = document.querySelector('.main-content');
    const stagesContainer = document.getElementById('stagesContainer');
    
    // 隐藏关卡容器
    stagesContainer.classList.remove('active');
    
    // 主内容区淡入
    setTimeout(() => {
        mainContent.classList.remove('fade-out');
    }, 300);
}

// 创建闪烁星星效果
function createSparkle() {
    const container = document.querySelector('.game-container');
    const sparkle = document.createElement('div');
    
    sparkle.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, #FFF 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 5;
        animation: sparkleAnim 1s ease-out forwards;
    `;
    
    // 随机位置（在标题周围）
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 - 50;
    const randomX = centerX + (Math.random() - 0.5) * 400;
    const randomY = centerY + (Math.random() - 0.5) * 150;
    
    sparkle.style.left = randomX + 'px';
    sparkle.style.top = randomY + 'px';
    
    container.appendChild(sparkle);
    
    // 添加动画样式
    if (!document.getElementById('sparkle-style')) {
        const style = document.createElement('style');
        style.id = 'sparkle-style';
        style.textContent = `
            @keyframes sparkleAnim {
                0% {
                    transform: scale(0) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    transform: scale(1) rotate(180deg);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(0) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 1秒后移除元素
    setTimeout(() => {
        sparkle.remove();
    }, 1000);
}

// 预加载字体
function preloadFonts() {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

// 页面加载完成后预加载
window.addEventListener('load', preloadFonts);
