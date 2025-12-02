/* ==== 1️⃣ Инициализация Firebase (замените YOUR_PROJECT_ID) ==== */
const firebaseConfig = {
    // НЕ ставьте слеш в конце URL!
    databaseURL: "https://queue-20edb-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const subjectsRef = db.ref('subjects');

/* ==== 2️⃣ Утилита ==== */
const $ = s => document.querySelector(s);

/* ==== 3️⃣ Рендер всех предметов ==== */
function renderAll() {
    subjectsRef.once('value')
        .then(snap => {
            const data = snap.val() || {};
            const container = $('#subjectsContainer');
            container.innerHTML = '';

            const subjects = Object.keys(data);
            if (subjects.length === 0) {
                container.innerHTML = `<p class="empty">Пока нет предметов. Добавьте их выше.</p>`;
                return;
            }

            subjects.forEach(subject => {
                const block = document.createElement('div');
                block.className = 'subject-block';

                /* ----- Заголовок + удаление ----- */
                const titleDiv = document.createElement('div');
                titleDiv.style.display = 'flex';
                titleDiv.style.justifyContent = 'space-between';
                titleDiv.style.alignItems = 'center';

                const title = document.createElement('h3');
                title.className = 'subject-title';
                title.textContent = subject;

                const delBtn = document.createElement('button');
                delBtn.className = 'remove-btn';
                delBtn.textContent = 'Удалить предмет';
                delBtn.onclick = () => {
                    if (confirm(`Удалить предмет "${subject}" и всю очередь?`)) {
                        subjectsRef.child(subject).remove()
                            .catch(err => console.error('remove subject error:', err));
                    }
                };
                titleDiv.append(title, delBtn);
                block.appendChild(titleDiv);

                /* ----- Форма добавления студента ----- */
                const form = document.createElement('form');
                form.innerHTML = `
                    <input type="text" placeholder="Имя студента" class="student-name" required>
                    <input type="text" placeholder="Комментарий (необязательно)" class="student-note">
                    <button type="submit">Записаться</button>
                `;
                // Защита от случайного GET‑запроса
                form.setAttribute('action', 'javascript:void(0)');
                form.onsubmit = e => {
                    e.preventDefault();
                    const name = form.querySelector('.student-name').value.trim();
                    const note = form.querySelector('.student-note').value.trim();
                    if (!name) return;
                    subjectsRef.child(`${subject}/queue`).push({name, note})
                        .catch(err => console.error('push student error:', err));
                    form.reset();
                };
                block.appendChild(form);

                /* ----- Список очереди ----- */
                const ul = document.createElement('ul');
                const queueObj = (data[subject] && data[subject].queue) || {};
                const entries = Object.entries(queueObj);
                if (entries.length === 0) {
                    ul.innerHTML = `<li class="empty">Очередь пуста.</li>`;
                } else {
                    entries.forEach(([key, item]) => {
                        const li = document.createElement('li');

                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'name';
                        nameSpan.textContent = item.name;
                        if (item.note) {
                            const note = document.createElement('small');
                            note.style.color = 'var(--muted)';
                            note.style.marginLeft = '0.5rem';
                            note.textContent = `(${item.note})`;
                            nameSpan.appendChild(note);
                        }

                        const rmBtn = document.createElement('button');
                        rmBtn.className = 'remove-btn';
                        rmBtn.textContent = 'Удалить';
                        rmBtn.onclick = () => {
                            subjectsRef.child(`${subject}/queue/${key}`).remove()
                                .catch(err => console.error('remove student error:', err));
                        };
                        li.append(nameSpan, rmBtn);
                        ul.appendChild(li);
                    });
                }
                block.appendChild(ul);
                container.appendChild(block);
            });
        })
        .catch(err => console.error('renderAll error:', err));
}

/* ==== 4️⃣ Добавление предмета ==== */
$('#subjectForm').addEventListener('submit', e => {
    e.preventDefault();               // ← ОТМЕНА обычного GET‑запроса
    const name = $('#subjectName').value.trim();
    if (!name) {
        alert('Введите название предмета');
        return;
    }

    subjectsRef.child(name).once('value')
        .then(snap => {
            if (snap.exists()) {
                alert('Такой предмет уже существует');
                return;
            }
            return subjectsRef.child(name).set({queue: {}});
        })
        .then(() => {
            $('#subjectName').value = '';
            renderAll();   // гарантируем обновление UI
        })
        .catch(err => console.error('add subject error:', err));
});

/* ==== 5️⃣ Подписка на изменения в базе ==== */
subjectsRef.on('value', renderAll);

/* ==== 6️⃣ Инициализация страницы ==== */
document.addEventListener('DOMContentLoaded', () => {
    $('#year').textContent = new Date().getFullYear();
    renderAll();   // стартовый рендер
});
