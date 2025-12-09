(() => {
    let unfollowed = 0;
    const maxUnfollows = 100;           // сколько за один запуск (до большой паузы)
    const pauseAfter = 50;              // ← после скольких отписок делать 10-минутную паузу
    let retryCount = 0;
    const maxRetries = 7;
    let observer = null;

    const scrollToBottom = () => window.scrollTo(0, document.body.scrollHeight);
    const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

    const getConfirmButton = () => {
        let btn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        if (btn) { console.log('Найдена по data-testid'); return btn; }

        btn = Array.from(document.querySelectorAll('div[role="button"], button')).find(el => 
            el.textContent.trim() === 'Unfollow' || el.textContent.trim() === 'Отписаться'
        );
        if (btn) { console.log('Найдена по тексту'); return btn; }

        btn = document.querySelector('div[role="dialog"] div[role="button"]:last-child');
        if (btn && (btn.textContent.includes('Unfollow') || btn.textContent.includes('Отписаться'))) {
            console.log('Найдена в модалке'); return btn;
        }
        return null;
    };

    const startObserver = () => {
        observer = new MutationObserver(() => {
            const confirmBtn = getConfirmButton();
            if (confirmBtn && retryCount < maxRetries) {
                console.log(`Observer кликнул подтверждение! (попытка ${retryCount + 1})`);
                confirmBtn.click();
                unfollowed++;
                console.log(`Отписались → ${unfollowed}`);

                observer.disconnect();
                retryCount = 0;

                // ←←← Проверяем, нужна ли большая пауза
                if (unfollowed % pauseAfter === 0) {
                    console.log(`Достигнуто ${unfollowed} отписок → делаем паузу 10 минут`);
                    sleep(600).then(() => {          // 600 сек = 10 минут
                        console.log('Пауза 10 минут закончилась → продолжаем');
                        scrollToBottom();
                        setTimeout(nextUnfollow, 3000);
                    });
                } else {
                    setTimeout(nextUnfollow, 3000);
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    const nextUnfollow = async () => {
        if (unfollowed >= maxUnfollows) {
            console.log(`Лимит ${maxUnfollows} достигнут → обнови страницу и запускай заново`);
            if (observer) observer.disconnect();
            return;
        }

        const followButtons = [...document.querySelectorAll('[data-testid$="-unfollow"]')];
        if (followButtons.length === 0) {
            console.log('Кнопок нет → прокручиваем...');
            scrollToBottom();
            await sleep(5);
            return nextUnfollow();
        }

        const btn = followButtons[0];
        console.log('Кликаем Following...');
        btn.click();

        retryCount = 1;
        startObserver();

        await sleep(5);  // ждём модалку

        // fallback
        setTimeout(() => {
            if (retryCount > 0) {
                const confirmBtn = getConfirmButton();
                if (confirmBtn) {
                    console.log('Fallback-клик');
                    confirmBtn.click();
                    unfollowed++;
                    console.log(`Отписались fallback → ${unfollowed}`);
                    if (unfollowed % pauseAfter === 0) {
                        console.log(`Достигнуто ${unfollowed} → пауза 10 минут`);
                        sleep(600).then(() => {
                            console.log('Пауза окончена → продолжаем');
                            setTimeout(nextUnfollow, 3000);
                        });
                    } else {
                        setTimeout(nextUnfollow, 3000);
                    }
                }
                if (observer) observer.disconnect();
                retryCount = 0;
                scrollToBottom();
            }
        }, 2500);
    };

    console.log('Скрипт запущен → 10-минутная пауза после каждых 50 отписок');
    nextUnfollow();
})();
