(() => {
    let unfollowed = 0;
    const maxUnfollows = 100;           // сколько отписаться за один запуск
    let retryCount = 0;
    const maxRetries = 7;               // увеличил попытки
    let observer = null;

    const scrollToBottom = () => window.scrollTo(0, document.body.scrollHeight);
    const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

    // Fallback-селекторы для кнопки подтверждения
    const getConfirmButton = () => {
        let btn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        if (btn) { console.log('Найдена по data-testid'); return btn; }

        btn = Array.from(document.querySelectorAll('div[role="button"], button')).find(el => 
            el.textContent.trim() === 'Unfollow' || el.textContent.trim() === 'Отписаться'
        );
        if (btn) { console.log('Найдена по тексту'); return btn; }

        btn = document.querySelector('div[role="dialog"] div[role="button"]:last-child');
        if (btn && (btn.textContent.includes('Unfollow') || btn.textContent.includes('Отписаться'))) {
            console.log('Найдена универсально в модалке'); return btn;
        }
        return null;
    };

    const startObserver = () => {
        observer = new MutationObserver(() => {
            const confirmBtn = getConfirmButton();
            if (confirmBtn && retryCount < maxRetries) {
                console.log(`Observer поймал модалку → кликаем! (попытка ${retryCount + 1})`);
                confirmBtn.click();
                unfollowed++;
                console.log(`Отписались! Всего: ${unfollowed}/${maxUnfollows}`);
                observer.disconnect();
                retryCount = 0;
                if (unfollowed >= maxUnfollows) {
                    console.log('Лимит достигнут → обнови страницу и запускай заново');
                    return;
                }
                setTimeout(nextUnfollow, 3000); // 3 секунды до следующего
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    const nextUnfollow = async () => {
        if (unfollowed >= maxUnfollows) {
            console.log('Готово за этот раунд! Обнови страницу для продолжения.');
            if (observer) observer.disconnect();
            return;
        }

        const followButtons = [...document.querySelectorAll('[data-testid$="-unfollow"]')];
        if (followButtons.length === 0) {
            console.log('Кнопок Following нет → прокручиваем вниз...');
            scrollToBottom();
            await sleep(5);           // ← увеличено
            return nextUnfollow();
        }

        const btn = followButtons[0];
        console.log('Кликаем кнопку Following...');
        btn.click();

        retryCount = 1;
        startObserver();

        await sleep(5);               // ← было 3 → стало 5 сек (главная задержка)

        // Fallback на случай, если observer не сработал
        setTimeout(() => {
            if (retryCount > 0) {     // значит observer ещё не кликнул
                const confirmBtn = getConfirmButton();
                if (confirmBtn) {
                    console.log('Fallback-клик (observer не успел)');
                    confirmBtn.click();
                    unfollowed++;
                    console.log(`Отписались fallback! Всего: ${unfollowed}`);
                } else {
                    console.log('Fallback тоже не нашёл кнопку → пропускаем этот аккаунт');
                }
                if (observer) observer.disconnect();
                retryCount = 0;
                scrollToBottom();
                setTimeout(nextUnfollow, 3000);
            }
        }, 2500);                     // проверяем через 2.5 сек после основного ожидания
    };

    console.log('Скрипт запущен с длинными паузами (5–7 сек между действиями)');
    nextUnfollow();
})();
