(() => {
    let unfollowed = 0;
    const maxUnfollows = 100;
    let retryCount = 0;
    const maxRetries = 5;
    let observer = null;

    const scrollToBottom = () => window.scrollTo(0, document.body.scrollHeight);
    const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

    // Fallback селекторы для кнопки подтверждения
    const getConfirmButton = () => {
        // 1. Основной data-testid
        let btn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        if (btn) {
            console.log('Найдена кнопка по data-testid="confirmationSheetConfirm"');
            return btn;
        }
        // 2. Fallback: по тексту (для EN/RU)
        btn = Array.from(document.querySelectorAll('div[role="button"], button')).find(el => 
            el.textContent.trim() === 'Unfollow' || el.textContent.trim() === 'Отписаться'
        );
        if (btn) {
            console.log('Найдена кнопка по тексту (Unfollow/Отписаться)');
            return btn;
        }
        // 3. Fallback: по aria-label
        btn = document.querySelector('[aria-label="Unfollow"], [aria-label="Отписаться"]');
        if (btn) {
            console.log('Найдена кнопка по aria-label');
            return btn;
        }
        // 4. Универсальный: красная кнопка в модалке
        btn = document.querySelector('div[role="dialog"] div[role="button"]:last-child');
        if (btn && btn.textContent.includes('Unfollow') || btn.textContent.includes('Отписаться')) {
            console.log('Найдена кнопка универсально (в модалке)');
            return btn;
        }
        return null;
    };

    // Observer для модалки
    const startObserver = () => {
        observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const confirmBtn = getConfirmButton();
                    if (confirmBtn && retryCount < maxRetries) {
                        console.log(`Observer поймал модалку! Retry: ${retryCount + 1}`);
                        confirmBtn.click();
                        unfollowed++;
                        console.log(`✅ Отписались! Итого: ${unfollowed}/${maxUnfollows}`);
                        observer.disconnect();
                        retryCount = 0;
                        if (unfollowed >= maxUnfollows) {
                            console.log('Лимит! Обнови и запусти заново.');
                            return;
                        }
                        setTimeout(() => nextUnfollow(), 1500);
                    }
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('Observer запущен — ждёт модалку...');
    };

    const nextUnfollow = async () => {
        if (unfollowed >= maxUnfollows) {
            console.log('Готово! Обнови страницу для продолжения.');
            if (observer) observer.disconnect();
            return;
        }

        const followButtons = [...document.querySelectorAll('[data-testid$="-unfollow"]')];
        if (followButtons.length === 0) {
            console.log('Нет кнопок — прокручиваем...');
            scrollToBottom();
            await sleep(3);
            nextUnfollow();
            return;
        }

        const btn = followButtons[0];
        console.log('Кликаем Following...');
        btn.click();
        retryCount++;
        startObserver(); // Запускаем слежку за модалкой
        await sleep(3); // Базовая задержка

        // Fallback: если observer не сработал, пробуем вручную
        setTimeout(() => {
            const confirmBtn = getConfirmButton();
            if (confirmBtn && retryCount <= maxRetries) {
                console.log('Fallback-клик на подтверждение!');
                confirmBtn.click();
                unfollowed++;
                console.log(`✅ Отписались fallback! Итого: ${unfollowed}`);
                if (observer) observer.disconnect();
                retryCount = 0;
            } else if (retryCount >= maxRetries) {
                console.log(`❌ Retry исчерпан (${maxRetries}). Пропускаем.`);
                retryCount = 0;
                if (observer) observer.disconnect();
            }
            scrollToBottom();
            setTimeout(nextUnfollow, 1000);
        }, 1000);
    };

    console.log('🚀 Улучшенный скрипт запущен! Проверь логи.');
    nextUnfollow().catch(console.error);
})();
