// 数据结构
let blocks = [];
let targetWords = parseInt(localStorage.getItem('vocabulary-target')) || 0;
let currentBlockId = null;
let wordInputs = [];
let achievementShown = false;
let currentDeleteData = null;
let currentEditData = null;
let currentDeleteBlockId = null;
let selectedBlocks = new Set();
let reviewMode = 'all';
let reviewType = 'word';

// 复习会话相关变量
let currentReviewWords = [];
let currentWordIndex = 0;
let correctCount = 0;
let wrongCount = 0;

// 从localStorage加载数据
function loadBlocks() {
    const savedBlocks = localStorage.getItem('vocabulary-blocks');
    if (savedBlocks) {
        try {
            blocks = JSON.parse(savedBlocks);
            console.log('Loaded blocks:', blocks); // 调试日志
        } catch (error) {
            console.error('Error loading blocks:', error);
            blocks = [];
        }
    }
}

// 保存数据到localStorage
function saveBlocks() {
    try {
        localStorage.setItem('vocabulary-blocks', JSON.stringify(blocks));
        console.log('Blocks saved successfully'); // 调试日志
    } catch (error) {
        console.error('Error saving blocks:', error);
        alert('保存失败，请稍后重试');
    }
}

// 更新单词统计
function updateStatistics() {
    const totalWords = blocks.reduce((sum, block) => sum + block.words.length, 0);
    document.getElementById('total-words').textContent = totalWords;
    updateProgress();
}

// 渲染块列表
function renderBlocks() {
    const container = document.getElementById('blocks-container');
    const blockList = document.getElementById('block-list');
    
    container.innerHTML = '';
    blockList.innerHTML = '';
    
    blocks.forEach((block, blockIndex) => {
        // 创建块元素
        const blockElement = document.createElement('div');
        blockElement.classList.add('block');
        blockElement.id = `block-${block.id}`;
        
        // 创建块头部
        const header = document.createElement('div');
        header.classList.add('block-header');
        
        const titleGroup = document.createElement('div');
        titleGroup.classList.add('title-group');
        
        const title = document.createElement('h3');
        title.classList.add('block-title');
        title.textContent = block.title;
        
        const deleteBlockButton = document.createElement('button');
        deleteBlockButton.classList.add('delete-button');
        deleteBlockButton.innerHTML = '<span class="delete-icon">×</span>';
        deleteBlockButton.onclick = (e) => {
            e.stopPropagation();
            showDeleteBlockModal(block.id, block.title);
        };
        
        titleGroup.appendChild(title);
        titleGroup.appendChild(deleteBlockButton);
        
        const addButton = document.createElement('button');
        addButton.classList.add('add-word-button');
        addButton.textContent = '添加单词';
        addButton.onclick = () => addWord(block.id);
        
        header.appendChild(titleGroup);
        header.appendChild(addButton);
        
        // 创建单词列表
        const wordList = document.createElement('ul');
        wordList.classList.add('word-list');
        
        block.words.forEach((wordObj, index) => {
            const wordItem = document.createElement('li');
            wordItem.classList.add('word-item');
            
            const wordContent = document.createElement('div');
            wordContent.classList.add('word-content');
            
            const number = document.createElement('span');
            number.classList.add('word-number');
            number.textContent = index + 1;
            
            const wordTextGroup = document.createElement('div');
            wordTextGroup.classList.add('word-text-group');
            
            const wordText = document.createElement('span');
            wordText.classList.add('word-text');
            wordText.textContent = wordObj.word;
            
            const translation = document.createElement('span');
            translation.classList.add('word-translation', 'masked');
            translation.textContent = wordObj.translation || '';
            
            const wordActions = document.createElement('div');
            wordActions.classList.add('word-actions');
            
            const editButton = document.createElement('button');
            editButton.classList.add('edit-word-button');
            editButton.innerHTML = '<span class="material-icons">edit</span>';
            editButton.onclick = (e) => {
                e.stopPropagation();
                showEditWordModal(block.id, index, wordObj.word, wordObj.translation);
            };
            
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-word-button');
            deleteButton.innerHTML = '<span class="material-icons">delete</span>';
            deleteButton.onclick = (e) => {
                e.stopPropagation();
                showDeleteConfirmModal(block.id, index, wordObj.word);
            };
            
            wordTextGroup.appendChild(wordText);
            wordTextGroup.appendChild(translation);
            
            wordContent.appendChild(number);
            wordContent.appendChild(wordTextGroup);
            wordItem.appendChild(wordContent);
            
            wordActions.appendChild(editButton);
            wordActions.appendChild(deleteButton);
            wordItem.appendChild(wordActions);
            
            // 添加译文点击事件
            translation.addEventListener('click', function() {
                this.classList.toggle('masked');
            });
            
            wordList.appendChild(wordItem);
        });
        
        blockElement.appendChild(header);
        blockElement.appendChild(wordList);
        container.appendChild(blockElement);
        
        // 添加到目录
        const navItem = document.createElement('li');
        navItem.classList.add('nav-item');
        
        // 创建序号
        const number = document.createElement('span');
        number.classList.add('nav-number');
        number.textContent = blockIndex + 1;
        
        // 创建标题文本
        const text = document.createElement('span');
        text.classList.add('nav-text');
        text.textContent = block.title;
        
        navItem.appendChild(number);
        navItem.appendChild(text);
        
        navItem.onclick = () => {
            // 移除其他项目的active类
            document.querySelectorAll('#block-list .nav-item').forEach(item => {
                item.classList.remove('active');
            });
            // 添加active类到当前项目
            navItem.classList.add('active');
            // 平滑滚动到目标块
            document.getElementById(`block-${block.id}`).scrollIntoView({ behavior: 'smooth' });
            // 添加高亮效果
            const targetBlock = document.getElementById(`block-${block.id}`);
            targetBlock.classList.add('highlight');
            setTimeout(() => targetBlock.classList.remove('highlight'), 2000);
        };
        blockList.appendChild(navItem);
    });
    
    updateStatistics();
}

// 添加新块
function addBlock() {
    const titleInput = document.getElementById('block-title');
    const title = titleInput.value.trim();
    
    if (title.length < 1) {
        alert('请输入块标题');
        return;
    }
    
    const newBlock = {
        id: Date.now(),
        title: title,
        words: []
    };
    
    blocks.push(newBlock);
    saveBlocks();
    renderBlocks();
    titleInput.value = '';
}

// 打开添加单词弹窗
function addWord(blockId) {
    currentBlockId = blockId;
    const modal = document.getElementById('add-words-modal');
    
    // 清空并重置模态框内容
    const container = modal.querySelector('.mi-modal-body');
    container.innerHTML = `
        <div class="word-input-fields">
            <input type="text" class="word-input" placeholder="输入单词">
            <input type="text" class="translation-input" placeholder="输入译文">
        </div>
    `;
    
    // 获取新的输入框
    const wordInput = container.querySelector('.word-input');
    const translationInput = container.querySelector('.translation-input');
    
    // 添加事件监听器
    wordInput.addEventListener('keypress', handleWordInputKeypress);
    translationInput.addEventListener('keypress', handleTranslationInputKeypress);
    
    // 显示模态框
    modal.classList.add('show');
    
    // 聚焦到单词输入框
    wordInput.focus();
}

// 处理单词输入框的回车事件
function handleWordInputKeypress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        // 获取当前输入组的译文输入框
        const currentGroup = e.target.closest('.word-input-fields');
        const translationInput = currentGroup.querySelector('.translation-input');
        translationInput.focus();
    }
}

// 处理译文输入框的回车事件
function handleTranslationInputKeypress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const currentGroup = e.target.closest('.word-input-fields');
        const wordInput = currentGroup.querySelector('.word-input');
        
        // 如果当前单词输入框有内容，创建新的输入组
        if (wordInput.value.trim()) {
            const container = document.querySelector('.mi-modal-body');
            
            // 创建新的输入组
            const newInputGroup = document.createElement('div');
            newInputGroup.className = 'word-input-fields';
            newInputGroup.innerHTML = `
                <input type="text" class="word-input" placeholder="输入单词">
                <input type="text" class="translation-input" placeholder="输入译文">
            `;
            
            // 添加到容器中
            container.appendChild(newInputGroup);
            
            // 为新的输入框添加事件监听
            const newWordInput = newInputGroup.querySelector('.word-input');
            const newTranslationInput = newInputGroup.querySelector('.translation-input');
            
            newWordInput.addEventListener('keypress', handleWordInputKeypress);
            newTranslationInput.addEventListener('keypress', handleTranslationInputKeypress);
            
            // 聚焦到新的单词输入框
            newWordInput.focus();
        }
    }
}

// 修改保存按钮的保存函数
function saveWords() {
    const wordGroups = document.querySelectorAll('.word-input-fields');
    let hasNewWords = false;
    
    wordGroups.forEach(group => {
        const wordInput = group.querySelector('.word-input');
        const translationInput = group.querySelector('.translation-input');
        const newWord = wordInput.value.trim();
        const newTranslation = translationInput.value.trim();
        
        if (newWord) {
            const block = blocks.find(b => b.id === currentBlockId);
            if (block) {
                // 检查是否有重复单词
                const isDuplicate = block.words.some(w => w.word === newWord);
                if (isDuplicate) {
                    showErrorToast(`重复添加了单词：${newWord}`);
                    return;
                }

                // 添加新单词到当前块
                block.words.push({
                    word: newWord,
                    translation: newTranslation
                });
                hasNewWords = true;
            }
        }
    });
    
    if (hasNewWords) {
        // 保存到 localStorage
        saveBlocks();
        // 重新渲染页面
        renderBlocks();
        // 显示成功提示
        showSuccessToast('单词添加成功！');
    }
    
    // 关闭模态框
    closeAddWordsModal();
}

// 添加单词输入框
function addWordInput() {
    const container = document.querySelector('.words-container');
    const newNumber = container.children.length + 1;
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'word-input-group';
    inputGroup.innerHTML = `
        <span class="word-input-number">${newNumber}</span>
        <div class="word-input-fields">
            <input type="text" class="word-input" placeholder="输入单词">
            <input type="text" class="translation-input" placeholder="输入译文">
        </div>
        <div class="word-input-actions">
            <button type="button" class="delete-input-btn mi-button-text">
                <span class="material-icons">close</span>
            </button>
        </div>
    `;
    
    // 添加回车键监听
    const wordInput = inputGroup.querySelector('.word-input');
    const translationInput = inputGroup.querySelector('.translation-input');
    
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            translationInput.focus();
        }
    });
    
    translationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addWordInput();
            container.lastElementChild.querySelector('.word-input').focus();
        }
    });
    
    // 添加删除按钮事件
    const deleteBtn = inputGroup.querySelector('.delete-input-btn');
    deleteBtn.onclick = () => {
        if (container.children.length > 1) {
            inputGroup.remove();
            updateInputNumbers();
        } else {
            // 如果是最后一个输入框，清空而不是删除
            wordInput.value = '';
            translationInput.value = '';
            wordInput.focus();
        }
    };
    
    container.appendChild(inputGroup);
}

// 关闭添加单词弹窗
function closeAddWordsModal() {
    const modal = document.getElementById('add-words-modal');
    modal.classList.remove('show');
    currentBlockId = null;
}

// 显示错误提示
function showErrorToast(message) {
    const toast = document.getElementById('error-toast');
    const errorMessage = toast.querySelector('.error-message');
    errorMessage.textContent = message;
    toast.classList.add('show');
    
    // 8秒后自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
    }, 8000);
}

// 检查单词是否重复
function checkDuplicateWords(blockId, newWords) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return [];
    
    const existingWords = new Set(block.words);
    const duplicates = [];
    const uniqueWords = [];
    
    newWords.forEach(word => {
        if (existingWords.has(word)) {
            duplicates.push(word);
        } else {
            uniqueWords.push(word);
            existingWords.add(word);
        }
    });
    
    return { uniqueWords, duplicates };
}

// 搜索功能
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', () => {
        const searchText = searchInput.value.toLowerCase();
        const items = document.querySelectorAll('#block-list .nav-item');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchText) ? '' : 'none';
        });
    });
}

// 删除块
function deleteBlock(blockId) {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index !== -1) {
        blocks.splice(index, 1);
        saveBlocks();
        renderBlocks();
    }
}

// 删除单词
function deleteWord(blockId, wordIndex) {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
        block.words.splice(wordIndex, 1);
        saveBlocks();
        renderBlocks();
    }
}

// 更新目标显示
function updateTargetDisplay() {
    const targetNumber = document.getElementById('target-number');
    targetNumber.textContent = targetWords ? targetWords.toLocaleString() : '-';
    updateProgress();
}

// 更新进度圈
function updateProgress() {
    const totalWords = blocks.reduce((sum, block) => sum + block.words.length, 0);
    const progress = targetWords ? (totalWords / targetWords * 100) : 0;
    const progressCircle = document.querySelector('.progress-circle .progress');
    const progressText = document.querySelector('.progress-text');
    
    const circumference = 2 * Math.PI * 36;
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = `${circumference * (1 - progress / 100)}`;
    progressText.textContent = `${Math.min(Math.round(progress), 100)}%`;

    // 检查是否达成目标
    if (targetWords && totalWords >= targetWords && !achievementShown) {
        showAchievement();
    }
}

// 设置目标
function setTarget() {
    const input = prompt('请输入词汇量目标：');
    const number = parseInt(input);
    if (number && number > 0) {
        targetWords = number;
        localStorage.setItem('vocabulary-target', number);
        achievementShown = false;
        updateTargetDisplay();
    }
}

// 显示成就提示
function showAchievement() {
    const toast = document.getElementById('achievement-toast');
    toast.classList.add('show');
    achievementShown = true;
    
    // 8秒后自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
    }, 8000);
}

// 编辑单词
function editWord(blockId, wordIndex, currentWord) {
    const newWord = prompt('编辑单词:', currentWord);
    if (!newWord || newWord.trim().length === 0 || newWord === currentWord) return;
    
    const block = blocks.find(b => b.id === blockId);
    if (block) {
        block.words[wordIndex] = newWord.trim();
        saveBlocks();
        renderBlocks();
    }
}

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    loadBlocks();
    renderBlocks();
    setupSearch();
    
    // 添加块按钮事件监听
    document.getElementById('add-block-button').addEventListener('click', addBlock);
    
    // 添加回车键监听
    document.getElementById('block-title').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addBlock();
        }
    });
    
    updateTargetDisplay();
    document.getElementById('set-target').addEventListener('click', setTarget);
}); 

// 显示删除确认弹窗
function showDeleteConfirmModal(blockId, wordIndex, word) {
    currentDeleteData = { blockId, wordIndex };
    const modal = document.getElementById('delete-confirm-modal');
    const message = modal.querySelector('.confirm-message');
    message.textContent = `确定要删除单词 "${word}" 吗？`;
    modal.classList.add('show');
}

// 关闭删除确认弹窗
function closeDeleteConfirmModal() {
    const modal = document.getElementById('delete-confirm-modal');
    modal.classList.remove('show');
    currentDeleteData = null;
}

// 确认删除
function confirmDelete() {
    if (currentDeleteData) {
        const { blockId, wordIndex } = currentDeleteData;
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            block.words.splice(wordIndex, 1);
            saveBlocks();
            renderBlocks();
        }
        closeDeleteConfirmModal();
    }
}

// 显示编辑弹窗
function showEditWordModal(blockId, wordIndex, currentWord, currentTranslation) {
    currentEditData = { blockId, wordIndex };
    const modal = document.getElementById('edit-word-modal');
    const wordInput = document.getElementById('edit-word-input');
    const translationInput = document.getElementById('edit-translation-input');
    
    wordInput.value = currentWord;
    translationInput.value = currentTranslation || '';
    modal.classList.add('show');
    wordInput.focus();
}

// 关闭编辑弹窗
function closeEditWordModal() {
    const modal = document.getElementById('edit-word-modal');
    modal.classList.remove('show');
    currentEditData = null;
}

// 确认编辑
function confirmEdit() {
    if (currentEditData) {
        const { blockId, wordIndex } = currentEditData;
        const newWord = document.getElementById('edit-word-input').value.trim();
        const newTranslation = document.getElementById('edit-translation-input').value.trim();
        
        if (!newWord) {
            alert('请输入单词');
            return;
        }
        
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            block.words[wordIndex] = { word: newWord, translation: newTranslation };
            saveBlocks();
            renderBlocks();
        }
        closeEditWordModal();
    }
}

// 显示删除块确认弹窗
function showDeleteBlockModal(blockId, blockTitle) {
    currentDeleteBlockId = blockId;
    const modal = document.getElementById('delete-block-modal');
    const message = modal.querySelector('.confirm-message');
    message.textContent = `确定要删除 "${blockTitle}" 及其所有单词吗？`;
    modal.classList.add('show');
}

// 关闭删除块确认弹窗
function closeDeleteBlockModal() {
    const modal = document.getElementById('delete-block-modal');
    modal.classList.remove('show');
    currentDeleteBlockId = null;
}

// 确认删除块
function confirmDeleteBlock() {
    if (currentDeleteBlockId) {
        const index = blocks.findIndex(b => b.id === currentDeleteBlockId);
        if (index !== -1) {
            blocks.splice(index, 1);
            saveBlocks();
            renderBlocks();
        }
        closeDeleteBlockModal();
    }
}

// 修改单词项的创建函数
function createWordElement(word, translation, number) {
    const wordItem = document.createElement('div');
    wordItem.className = 'word-item';
    
    wordItem.innerHTML = `
        <div class="word-content">
            <span class="word-number">${number}</span>
            <div class="word-text-group">
                <span class="word-text">${word}</span>
                <span class="word-translation masked">${translation}</span>
            </div>
        </div>
        <div class="word-actions">
            <button class="edit-word-button">
                <span class="material-icons">edit</span>
            </button>
            <button class="delete-word-button">
                <span class="material-icons">delete</span>
            </button>
        </div>
    `;

    // 添加译文点击事件
    const translationElement = wordItem.querySelector('.word-translation');
    translationElement.addEventListener('click', function() {
        this.classList.toggle('masked');
    });

    // 添加编辑按钮事件
    const editButton = wordItem.querySelector('.edit-word-button');
    editButton.addEventListener('click', () => {
        openEditWordModal(word, translation, wordItem);
    });

    // 添加删除按钮事件
    const deleteButton = wordItem.querySelector('.delete-word-button');
    deleteButton.addEventListener('click', () => {
        openDeleteConfirmModal(wordItem);
    });

    return wordItem;
}

// 添加成功提示函数
function showSuccessToast(message) {
    const toast = document.getElementById('achievement-toast');
    const messageElement = toast.querySelector('.achievement-message');
    messageElement.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 更新输入框序号
function updateInputNumbers() {
    const numbers = document.querySelectorAll('.word-input-number');
    numbers.forEach((num, index) => {
        num.textContent = index + 1;
    });
}

// 打开复习模态框
function showReviewModal() {
    const modal = document.getElementById('review-modal');
    modal.classList.add('show');
    
    // 初始化复习模式
    setupReviewModeHandlers();
    // 渲染块列表
    renderBlockSelection();
}

// 关闭复习模态框
function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    modal.classList.remove('show');
    selectedBlocks.clear();
}

// 设置复习模式切换处理
function setupReviewModeHandlers() {
    const modeInputs = document.querySelectorAll('input[name="review-mode"]');
    const blockSection = document.getElementById('block-selection-section');
    const wordCountSection = document.getElementById('word-count-section');
    
    modeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            reviewMode = e.target.value;
            
            // 切换显示相应的选项
            if (reviewMode === 'all') {
                blockSection.style.display = 'none';
                wordCountSection.style.display = 'block';
            } else {
                blockSection.style.display = 'block';
                wordCountSection.style.display = 'none';
                
                // 清空之前的选择
                selectedBlocks.clear();
                renderBlockSelection();
            }
        });
    });
}

// 渲染块选择列表
function renderBlockSelection() {
    const blockList = document.querySelector('#block-selection-section .block-list');
    blockList.innerHTML = '';
    
    blocks.forEach(block => {
        const blockItem = document.createElement('div');
        blockItem.className = 'block-item';
        if (selectedBlocks.has(block.id)) {
            blockItem.classList.add('selected');
        }
        
        // 单选或多选的处理
        if (reviewMode === 'single') {
            blockItem.innerHTML = `
                <input type="radio" name="block-select" class="block-radio" 
                    ${selectedBlocks.has(block.id) ? 'checked' : ''}>
                <span>${block.title} (${block.words.length}词)</span>
            `;
        } else {
            blockItem.innerHTML = `
                <input type="checkbox" class="block-checkbox" 
                    ${selectedBlocks.has(block.id) ? 'checked' : ''}>
                <span>${block.title} (${block.words.length}词)</span>
            `;
        }
        
        blockItem.addEventListener('click', () => {
            if (reviewMode === 'single') {
                selectedBlocks.clear();
                selectedBlocks.add(block.id);
            } else {
                if (selectedBlocks.has(block.id)) {
                    selectedBlocks.delete(block.id);
                } else {
                    selectedBlocks.add(block.id);
                }
            }
            renderBlockSelection();
        });
        
        blockList.appendChild(blockItem);
    });
}

// 搜索块
function setupBlockSearch() {
    const searchInput = document.getElementById('review-search-input');
    searchInput.addEventListener('input', () => {
        const searchText = searchInput.value.toLowerCase();
        const blockItems = document.querySelectorAll('.block-item');
        
        blockItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchText) ? '' : 'none';
        });
    });
}

// 开始复习
function startReview() {
    // 获取复习类型
    reviewType = document.querySelector('input[name="review-type"]:checked').value;
    
    // 验证选择
    if (reviewMode === 'all') {
        const count = parseInt(document.getElementById('review-word-count').value);
        if (!count || count < 1) {
            alert('请输入有效的复习单词数量');
            return;
        }
    } else if (selectedBlocks.size === 0) {
        alert('请选择要复习的块');
        return;
    }
    
    // 准备复习数据
    const reviewWords = prepareReviewWords();
    if (reviewWords.length === 0) {
        alert('没有可复习的单词');
        return;
    }
    
    // 开始复习（这里需要另外实现复习界面）
    startReviewSession(reviewWords);
}

// 准备复习单词
function prepareReviewWords() {
    let words = [];
    
    if (reviewMode === 'all') {
        // 从所有块中收集单词
        blocks.forEach(block => {
            words.push(...block.words);
        });
        
        // 随机打乱并限制数量
        words = shuffleArray(words);
        const count = parseInt(document.getElementById('review-word-count').value);
        words = words.slice(0, count);
    } else {
        // 从选中的块中收集单词
        blocks.forEach(block => {
            if (selectedBlocks.has(block.id)) {
                words.push(...block.words);
            }
        });
        
        // 随机打乱
        words = shuffleArray(words);
    }
    
    return words;
}

// 数组随机打乱
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 初始化复习功能
document.addEventListener('DOMContentLoaded', () => {
    // 添加开始复习按钮事件
    document.getElementById('start-review').addEventListener('click', showReviewModal);
    
    // 设置复习模式切换处理
    setupReviewModeHandlers();
    
    // 设置块搜索功能
    setupBlockSearch();
});

// 开始复习会话
function startReviewSession(words) {
    currentReviewWords = words;
    currentWordIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    
    // 关闭设置模态框，打开复习模态框
    closeReviewModal();
    const modal = document.getElementById('review-session-modal');
    modal.classList.add('show');
    
    // 更新进度显示
    document.getElementById('current-word-number').textContent = '1';
    document.getElementById('total-words-number').textContent = words.length;
    
    // 显示第一个单词
    showCurrentWord();
    
    // 聚焦输入框
    document.getElementById('review-input').focus();
}

// 显示当前单词
function showCurrentWord() {
    const currentWord = currentReviewWords[currentWordIndex];
    const reviewText = document.getElementById('review-text');
    const reviewPrompt = document.getElementById('review-prompt');
    const input = document.getElementById('review-input');
    const result = document.getElementById('review-result');
    
    // 重置界面
    input.value = '';
    input.disabled = false;
    input.className = 'mi-input';
    input.dataset.checked = 'false';
    result.className = 'review-result';
    result.innerHTML = '';
    
    // 根据复习类型显示不同内容
    if (reviewType === 'audio') {
        showAudioQuestion(currentWord, reviewPrompt, reviewText);
    } else if (reviewType === 'word') {
        reviewPrompt.textContent = '请输入单词：';
        reviewText.textContent = currentWord.translation;
    } else if (reviewType === 'translation') {
        reviewPrompt.textContent = '请输入译文：';
        reviewText.textContent = currentWord.word;
    } else if (reviewType === 'mixed') {
        // 混合模式随机选择（包括语音模式）
        const mode = Math.random();
        if (mode < 0.33) { // 单词默写
            reviewPrompt.textContent = '请输入单词：';
            reviewText.textContent = currentWord.translation;
            currentWord.currentMode = 'word';
        } else if (mode < 0.66) { // 译文默写
            reviewPrompt.textContent = '请输入译文：';
            reviewText.textContent = currentWord.word;
            currentWord.currentMode = 'translation';
        } else { // 语音默写
            showAudioQuestion(currentWord, reviewPrompt, reviewText);
            currentWord.currentMode = 'audio';
        }
    }
    
    // 添加回车键监听
    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            if (input.dataset.checked === 'false') {
                checkAnswer();
            } else {
                nextWord();
            }
        }
    };
    
    // 聚焦输入框
    input.focus();
}

// 添加显示语音问题的辅助函数
function showAudioQuestion(currentWord, reviewPrompt, reviewText) {
    reviewPrompt.innerHTML = `
        请听写单词：
        <button class="audio-button" onclick="playAudio('${currentWord.word}')">
            <span class="material-icons">volume_up</span>
        </button>
    `;
    reviewText.textContent = '';  // 清空文本显示
    // 自动播放一次
    setTimeout(() => playAudio(currentWord.word), 500);
}

// 检查答案
function checkAnswer() {
    const input = document.getElementById('review-input');
    const result = document.getElementById('review-result');
    const currentWord = currentReviewWords[currentWordIndex];
    const userAnswer = input.value.trim();
    
    if (!userAnswer) {
        return;
    }
    
    let correct = false;
    let correctAnswer = '';
    let isAudioMode = false;
    
    // 判断是否为语音模式
    if (reviewType === 'audio' || (reviewType === 'mixed' && currentWord.currentMode === 'audio')) {
        isAudioMode = true;
    }
    
    // 检查答案
    if (isAudioMode || reviewType === 'word' || 
        (reviewType === 'mixed' && currentWord.currentMode === 'word')) {
        correct = userAnswer.toLowerCase() === currentWord.word.toLowerCase();
        correctAnswer = currentWord.word;
    } else {
        const cleanUserAnswer = userAnswer.replace(/[.,，。！？!?]/g, '').replace(/\s+/g, '');
        const cleanCorrectAnswer = currentWord.translation.replace(/[.,，。！？!?]/g, '').replace(/\s+/g, '');
        correct = cleanUserAnswer.toLowerCase() === cleanCorrectAnswer.toLowerCase();
        correctAnswer = currentWord.translation;
    }
    
    // 更新输入框样式
    input.classList.remove('mi-input');
    input.classList.add(correct ? 'correct' : 'wrong');
    
    // 显示结果
    result.className = 'review-result';
    if (!correct) {
        result.innerHTML = `
            <span class="error-mark">${userAnswer}</span>
            <span class="correct-text">
                ${correctAnswer}
                ${isAudioMode ? `
                    <button class="audio-button" onclick="playAudio('${correctAnswer}')">
                        <span class="material-icons">volume_up</span>
                    </button>
                ` : ''}
            </span>
        `;
    } else {
        result.innerHTML = `
            <span class="correct-text">
                正确！
                ${isAudioMode ? `
                    <button class="audio-button" onclick="playAudio('${correctAnswer}')">
                        <span class="material-icons">volume_up</span>
                    </button>
                ` : ''}
            </span>
        `;
    }
    
    // 更新统计
    if (correct) {
        correctCount++;
    } else {
        wrongCount++;
    }
    
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('wrong-count').textContent = wrongCount;
    
    input.dataset.checked = 'true';
}

// 显示答案
function showAnswer() {
    const input = document.getElementById('review-input');
    const result = document.getElementById('review-result');
    const currentWord = currentReviewWords[currentWordIndex];
    const correctAnswer = reviewType === 'word' || 
        (reviewType === 'mixed' && currentWord.currentMode === 'word') ? 
        currentWord.word : currentWord.translation;
    
    result.className = 'review-result';
    result.innerHTML = `<span class="correct-text">${correctAnswer}</span>`;
    
    // 标记为已检查，这样可以进入下一题
    input.dataset.checked = 'true';
}

// 下一个单词
function nextWord() {
    const input = document.getElementById('review-input');
    
    // 只有在已检查答案的情况下才能进入下一个
    if (input.dataset.checked === 'false') {
        return;
    }
    
    currentWordIndex++;
    
    if (currentWordIndex >= currentReviewWords.length) {
        // 复习完成
        showReviewComplete();
    } else {
        // 显示下一个单词
        document.getElementById('current-word-number').textContent = currentWordIndex + 1;
        showCurrentWord();
    }
}

// 显示复习完成
function showReviewComplete() {
    const modal = document.getElementById('review-session-modal');
    const accuracy = Math.round((correctCount / currentReviewWords.length) * 100);
    
    modal.querySelector('.mi-modal-body').innerHTML = `
        <div class="review-complete">
            <h2>复习完成！</h2>
            <div class="review-stats-final">
                <div class="stat-item">
                    <span class="stat-label">总词数</span>
                    <span class="stat-value">${currentReviewWords.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">正确</span>
                    <span class="stat-value">${correctCount}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">错误</span>
                    <span class="stat-value">${wrongCount}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">正确率</span>
                    <span class="stat-value">${accuracy}%</span>
                </div>
            </div>
        </div>
    `;
    
    modal.querySelector('.mi-modal-footer').innerHTML = `
        <button class="mi-button" onclick="closeReviewSession()">完成</button>
    `;
}

// 关闭复习会话
function closeReviewSession() {
    const modal = document.getElementById('review-session-modal');
    modal.classList.remove('show');
}

// 添加语音相关函数
function playAudio(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';  // 设置为美式英语
    utterance.rate = 0.8;      // 设置语速稍慢一点
    speechSynthesis.speak(utterance);
}