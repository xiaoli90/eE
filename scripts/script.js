const reviewIntervals = [
    { label: '5分钟', duration: 5 * 60 * 1000 },
    { label: '30分钟', duration: 30 * 60 * 1000 },
    { label: '12小时', duration: 12 * 60 * 60 * 1000 },
    { label: '1天', duration: 24 * 60 * 60 * 1000 },
    { label: '2天', duration: 2 * 24 * 60 * 60 * 1000 },
    { label: '4天', duration: 4 * 24 * 60 * 60 * 1000 },
    { label: '7天', duration: 7 * 24 * 60 * 60 * 1000 },
    { label: '15天', duration: 15 * 24 * 60 * 60 * 1000 },
    { label: '1个月', duration: 30 * 24 * 60 * 60 * 1000 },
    { label: '3个月', duration: 90 * 24 * 60 * 60 * 1000 },
    { label: '6个月', duration: 180 * 24 * 60 * 60 * 1000 },
];

// 将数据获取移到函数中
function loadTexts() {
    const savedTexts = localStorage.getItem('texts');
    if (savedTexts) {
        try {
            texts = JSON.parse(savedTexts);
            console.log('Loaded texts:', texts);
        } catch (error) {
            console.error('Error loading texts:', error);
            texts = [];
        }
    } else {
        texts = [];
    }
}

let texts = [];

// 在页面加载时读取数据
window.addEventListener('DOMContentLoaded', () => {
    loadTexts();
    renderCards();
    updateReviewList();
});

const addTextButton = document.getElementById('add-text-button');
const textNameInput = document.getElementById('text-name');
const cardsContainer = document.getElementById('cards-container');
const completedCyclesElem = document.getElementById('completed-cycles');
const remainingCyclesElem = document.getElementById('remaining-cycles');
const progressElem = document.getElementById('progress');
const navList = document.getElementById('nav-list');
const notification = document.getElementById('notification');

function addNewText() {
    const name = textNameInput.value.trim();
    if (name.length < 1) {
        alert('请输入课文名称');
        return;
    }
    const newText = {
        id: Date.now(),
        name,
        currentCycle: 0,
        nextReviewTime: Date.now() + reviewIntervals[0].duration,
        done: false
    };
    texts.push(newText);
    saveAndRender();
    textNameInput.value = '';
}

// 添加点击事件监听
addTextButton.addEventListener('click', addNewText);

// 添加回车键监听
textNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // 阻止默认的回车换行
        addNewText();
    }
});

function saveAndRender() {
    localStorage.setItem('texts', JSON.stringify(texts));
    renderCards();
}

function renderCards() {
    cardsContainer.innerHTML = '';
    navList.innerHTML = '';
    texts.forEach((text, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        if (text.done) {
            card.classList.add('done');
        }
        
        const number = document.createElement('div');
        number.classList.add('card-number');
        number.textContent = `${index + 1}`;

        const title = document.createElement('h3');
        title.textContent = text.name;
        
        const statistics = document.createElement('div');
        statistics.classList.add('card-statistics');
        statistics.innerHTML = `
            <p>已完成复习周期: ${text.currentCycle}</p>
            <p>剩余复习周期: ${reviewIntervals.length - text.currentCycle}</p>
        `;
        
        const timer = document.createElement('div');
        timer.classList.add('timer');
        timer.id = `timer-${text.id}`;
        
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = '删除';
        deleteButton.addEventListener('click', () => {
            deleteCard(text.id);
        });

        const completeButton = document.createElement('button');
        completeButton.classList.add('complete-button');
        completeButton.textContent = '完成复习';
        completeButton.disabled = text.done;

        completeButton.addEventListener('click', () => {
            completeReview(text.id);
        });

        // 创建按钮组容器
        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('button-group');
        buttonGroup.appendChild(completeButton);
        buttonGroup.appendChild(deleteButton);

        card.appendChild(number);
        card.appendChild(title);
        card.appendChild(statistics);
        card.appendChild(timer);
        card.appendChild(buttonGroup);

        if (text.done) {
            const message = document.createElement('div');
            message.classList.add('message');
            message.textContent = '你真棒，你的坚持配的上你的努力';
            card.appendChild(message);
        }

        cardsContainer.appendChild(card);
        updateTimer(text);

        // 添加导航项
        const navItem = document.createElement('li');
        navItem.classList.add('nav-item');
        navItem.innerHTML = `
            <span class="nav-number">${index + 1}</span>
            <span class="nav-text">${text.name}</span>
        `;
        navItem.addEventListener('click', () => {
            const card = document.getElementById(`card-${text.id}`);
            card.scrollIntoView({ behavior: 'smooth' });
            navItem.classList.add('active');
            setTimeout(() => navItem.classList.remove('active'), 1000);
        });
        navList.appendChild(navItem);

        // 为卡片添加 ID
        card.id = `card-${text.id}`;
    });
}

function updateTimer(text) {
    const timerElem = document.getElementById(`timer-${text.id}`);
    if (text.done) {
        timerElem.textContent = '复习完成';
        return;
    }

    if (timerElem.intervalId) {
        clearInterval(timerElem.intervalId);
    }

    function update() {
        const now = Date.now();
        const remaining = text.nextReviewTime - now;
        if (remaining > 0) {
            timerElem.textContent = `下次复习: ${formatTime(remaining)}`;
        } else {
            timerElem.textContent = '可以复习了！';
            clearInterval(timerElem.intervalId);
            playNotification();
            updateReviewList();
        }
    }

    update();
    timerElem.intervalId = setInterval(update, 1000);
}

function deleteCard(id) {
    const index = texts.findIndex(t => t.id === id);
    if (index === -1) return;
    texts.splice(index, 1);
    saveAndRender();
}

function completeReview(id) {
    const index = texts.findIndex(t => t.id === id);
    if (index === -1) return;
    const text = texts[index];
    if (text.done) return;

    text.currentCycle += 1;
    if (text.currentCycle >= reviewIntervals.length) {
        text.done = true;
    } else {
        text.nextReviewTime = Date.now() + reviewIntervals[text.currentCycle].duration;
    }
    saveAndRender();
    updateReviewList();
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}分${seconds}秒`;
}

// 音频播放函数
async function playNotification() {
    try {
        notification.currentTime = 0;
        await notification.play();
    } catch (error) {
        console.error('播放音频失败:', error);
    }
}

// 初始化音频
window.addEventListener('load', () => {
    // 加载音频
    notification.load();
    
    // 用户首次点击时初始化音频
    document.addEventListener('click', async () => {
        try {
            await notification.play();
            notification.pause();
            notification.currentTime = 0;
        } catch (error) {
            console.error('初始化音频失败:', error);
        }
    }, { once: true }); // 只执行一次
});

// 更新待复习列表
function updateReviewList() {
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = '';
    
    texts.forEach((text, index) => {
        if (!text.done && text.nextReviewTime <= Date.now()) {
            const reviewItem = document.createElement('li');
            reviewItem.classList.add('review-item');
            
            const number = document.createElement('span');
            number.classList.add('review-item-number');
            number.textContent = index + 1;
            
            const name = document.createElement('span');
            name.textContent = text.name;
            
            reviewItem.appendChild(number);
            reviewItem.appendChild(name);
            
            // 点击跳转到对应卡片
            reviewItem.addEventListener('click', () => {
                const card = document.getElementById(`card-${text.id}`);
                card.scrollIntoView({ behavior: 'smooth' });
                card.classList.add('highlight');
                setTimeout(() => card.classList.remove('highlight'), 2000);
            });
            
            reviewList.appendChild(reviewItem);
        }
    });
} 