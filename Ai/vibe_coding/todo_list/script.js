document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const titleInput = document.getElementById('title');
    const dateInput = document.getElementById('date-input');
    const descriptionInput = document.getElementById('description');
    const saveBtn = document.getElementById('saveBtn');
    const todoList = document.getElementById('todo-list');
    const calendarContainer = document.getElementById('calendar-container');

    // --- HELPERS ---
    const getTodayDateString = () => new Date().toISOString().split('T')[0];
    const dateToYYYYMMDD = (d) => d.toISOString().split('T')[0];

    // --- STATE ---
    let navDate = new Date(); // The month/year the calendar is showing
    let selectedDate = getTodayDateString(); // The date selected for filtering

    // --- LOCAL STORAGE ---
    const getTodos = () => JSON.parse(localStorage.getItem('todos')) || [];
    const saveTodos = (todos) => localStorage.setItem('todos', JSON.stringify(todos));

    // --- RENDER FUNCTIONS ---

    const renderApp = () => {
        renderTodos();
        renderCalendar();
    };

    const renderTodos = () => {
        const allTodos = getTodos();
        todoList.innerHTML = '';

        const todosToRender = selectedDate
            ? allTodos.filter(todo => todo.date === selectedDate)
            : allTodos;

        if (todosToRender.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = selectedDate ? `${new Date(selectedDate+'T00:00:00').toLocaleDateString('ko-KR')}에는 할 일이 없습니다.` : '등록된 할 일이 없습니다.';
            todoList.appendChild(emptyMessage);
            return;
        }

        const grouped = todosToRender.reduce((acc, todo) => {
            (acc[todo.date] = acc[todo.date] || []).push(todo);
            return acc;
        }, {});

        Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
            const dateHeader = document.createElement('h2');
            dateHeader.className = 'date-header';
            dateHeader.textContent = new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
            todoList.appendChild(dateHeader);

            grouped[date].forEach(todo => {
                const li = document.createElement('li');
                li.dataset.id = todo.id;
                if (todo.completed) {
                    li.classList.add('completed');
                }
                li.innerHTML = todo.isEditing ? getEditHTML(todo) : getViewHTML(todo);
                todoList.appendChild(li);
            });
        });
    };

    const getViewHTML = (todo) => `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} title="완료/미완료">
        <div class="todo-item-content">
            <p class="todo-title">${todo.title}</p>
            <p class="todo-description" style="display: none;">${todo.description || ''}</p>
        </div>
        <div class="button-group">
            <button class="edit-btn" title="수정">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button class="delete-btn" title="삭제">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </div>`;

    const getEditHTML = (todo) => `
        <div class="todo-item-content">
            <input type="text" class="edit-title" value="${todo.title}">
            <textarea class="edit-description">${todo.description || ''}</textarea>
        </div>
        <div class="button-group">
            <button class="update-btn" title="저장">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            </button>
            <button class="cancel-btn" title="취소">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>`;
    
    const renderCalendar = () => {
        const year = navDate.getFullYear();
        const month = navDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const todoDates = new Set(getTodos().map(todo => todo.date));

        let html = `
            <div class="calendar-header">
                <button class="nav-btn" id="prev-month">&lt;</button>
                <h2>${year}년 ${month + 1}월</h2>
                <button class="nav-btn" id="next-month">&gt;</button>
            </div>
            <div class="calendar-grid">
                <div class="day-name">일</div><div class="day-name">월</div><div class="day-name">화</div>
                <div class="day-name">수</div><div class="day-name">목</div><div class="day-name">금</div><div class="day-name">토</div>
        `;

        for (let i = 0; i < firstDay; i++) html += `<div class="day empty"></div>`;

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = dateToYYYYMMDD(date);
            const todayStr = getTodayDateString();

            let classes = 'day';
            if (dateStr === todayStr) classes += ' today';
            if (dateStr === selectedDate) classes += ' selected';
            if (todoDates.has(dateStr)) classes += ' has-todos';

            html += `<div class="${classes}" data-date="${dateStr}">${i}</div>`;
        }
        
        html += '</div>';
        calendarContainer.innerHTML = html;
    };


    // --- EVENT LISTENERS ---

    saveBtn.addEventListener('click', () => {
        if (titleInput.value.trim() === '') {
            alert('제목을 입력해주세요.');
            return;
        }
        const todos = getTodos();
        todos.push({
            id: Date.now(),
            date: dateInput.value || getTodayDateString(),
            title: titleInput.value,
            description: descriptionInput.value,
            isEditing: false,
            completed: false // Add completed property
        });
        saveTodos(todos);
        
        titleInput.value = '';
        descriptionInput.value = '';
        dateInput.value = getTodayDateString();
        
        renderApp();
    });

    todoList.addEventListener('click', (e) => {
        const todos = getTodos();
        const findTodoIndex = (id) => todos.findIndex(todo => todo.id == id);
        const targetLi = e.target.closest('li');

        if (!targetLi) return;
        const todoId = targetLi.dataset.id;
        const index = findTodoIndex(todoId);
        if (index === -1) return;

        // Handle checkbox click
        if (e.target.classList.contains('todo-checkbox')) {
            todos[index].completed = !todos[index].completed;
            saveTodos(todos);
            renderApp();
            return; // Stop further execution
        }
        
        // Handle title click for description toggle
        if (e.target.classList.contains('todo-title')) {
            e.target.nextElementSibling.style.display = e.target.nextElementSibling.style.display === 'none' ? 'block' : 'none';
            return;
        }

        // Handle button clicks
        const button = e.target.closest('button');
        if (!button) return;

        if (button.classList.contains('delete-btn')) todos.splice(index, 1);
        else if (button.classList.contains('edit-btn')) todos[index].isEditing = true;
        else if (button.classList.contains('cancel-btn')) todos[index].isEditing = false;
        else if (button.classList.contains('update-btn')) {
            todos[index].title = targetLi.querySelector('.edit-title').value;
            todos[index].description = targetLi.querySelector('.edit-description').value;
            todos[index].isEditing = false;
        }

        saveTodos(todos);
        renderApp();
    });

    calendarContainer.addEventListener('click', (e) => {
        if (e.target.id === 'prev-month') {
            navDate.setMonth(navDate.getMonth() - 1);
            renderApp();
        } else if (e.target.id === 'next-month') {
            navDate.setMonth(navDate.getMonth() + 1);
            renderApp();
        } else if (e.target.classList.contains('day') && !e.target.classList.contains('empty')) {
            const date = e.target.dataset.date;
            selectedDate = selectedDate === date ? null : date;
            renderApp();
        }
    });

    // --- INITIALIZATION ---
    dateInput.value = getTodayDateString();
    renderApp();
});