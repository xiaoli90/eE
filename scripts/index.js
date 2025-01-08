// 更新待复习列表显示
function updateReviewList() {
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = '';
    
    const now = new Date();
    const dueItems = items.filter(item => {
        const nextReview = new Date(item.nextReview);
        return nextReview <= now;
    });
    
    if (dueItems.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.classList.add('empty-message');
        emptyMessage.textContent = '太棒了！目前没有需要复习的内容';
        reviewList.appendChild(emptyMessage);
        return;
    }
    
    dueItems.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('review-item');
        
        const title = document.createElement('span');
        title.classList.add('review-title');
        title.textContent = item.title;
        
        const dueDate = document.createElement('span');
        dueDate.classList.add('review-due');
        dueDate.textContent = formatDate(new Date(item.nextReview));
        
        li.appendChild(title);
        li.appendChild(dueDate);
        
        li.onclick = () => startReview(item);
        
        reviewList.appendChild(li);
    });
}

// 完成复习
function completeReview() {
    if (currentItem) {
        // 更新复习时间
        const now = new Date();
        currentItem.lastReview = now.toISOString();
        currentItem.nextReview = calculateNextReview(now, currentItem.level).toISOString();
        currentItem.level++;
        
        saveItems();
        updateReviewList(); // 立即更新待复习列表
        
        // 关闭复习弹窗
        const modal = document.getElementById('review-modal');
        modal.classList.remove('show');
        currentItem = null;
    }
}

// 标记为未掌握
function markNotMastered() {
    if (currentItem) {
        // 重置级别和下次复习时间
        currentItem.level = 1;
        const now = new Date();
        currentItem.lastReview = now.toISOString();
        currentItem.nextReview = calculateNextReview(now, 0).toISOString();
        
        saveItems();
        updateReviewList(); // 立即更新待复习列表
        
        // 关闭复习弹窗
        const modal = document.getElementById('review-modal');
        modal.classList.remove('show');
        currentItem = null;
    }
}

// 删除复习项目
function deleteItem(itemId) {
    const index = items.findIndex(item => item.id === itemId);
    if (index !== -1) {
        items.splice(index, 1);
        saveItems();
        updateReviewList(); // 立即更新待复习列表
    }
} 