(() => {
    let liked = 0;
    const pauseAfter = 50;           
    const maxLikes = 500;            // сколько лайкнуть за один запуск
    const bigPause = 600;            // 10 минут = 600 секунд

    const scroll = () => window.scrollTo(0, document.body.scrollHeight);
    const sleep = (sec) => new Promise(r => setTimeout(r, sec * 1000));

    // Кнопка лайка в комментариях (работает на всех языках в 2025)
    const getLikeButtons = () => 
        [...document.querySelectorAll('div[data-testid="reply"]')]
            .map(reply => reply.closest('article')?.querySelector('div[data-testid="like"]'))
            .filter(btn => btn && !btn.querySelector('svg[aria-label="Liked"], svg[aria-label="Понравилось"]'));

    const doBigPause = () => {
        console.log(`\n50 лайков сделано → пауза 10 минут (до ${new Date(Date.now() + bigPause*1000).toLocaleTimeString()})\n`);
        return sleep(bigPause).then(() => {
            console.log('Пауза 10 минут закончилась → продолжаем лайкать');
            scroll();
        });
    };

    const likeNext = async () => {
        if (liked >= maxLikes) {
            console.log(`Достигнут лимит ${maxLikes}. Обнови страницу и запускай заново, если нужно ещё.`);
            return;
        }

        const buttons = getLikeButtons();
        if (buttons.length === 0) {
            console.log('Лайкать больше нечего → прокручиваем вниз...');
            scroll();
            await sleep(6);
            return likeNext();
        }

        const btn = buttons[0];
        btn.click();
        liked++;
        console.log(`Лайк #${liked} поставлен`);

        // Пауза после каждых 50
        if (liked % pauseAfter === 0) {
            await doBigPause();
        }

        await sleep(Math.random() * 2 + 5); // 5–7 секунд между лайками
        scroll();
        likeNext();
    };

    console.log('Скрипт лайка комментариев запущен\nПауза 10 минут после каждых 50 лайков\nОстановка на 500\n');
    likeNext();
})();
