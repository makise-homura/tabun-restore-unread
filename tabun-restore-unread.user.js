// ==UserScript==
// @name         Восстановление непрочитанных комментов на Табуне
// @version      0.2
// @description  Добавляет возможность "вспомнить" непрочитанные комменты после случайного обновления или закрытия страницы
// @author       makise_homura
// @match        https://tabun.everypony.ru/*
// @match        https://tabun.everypony.info/*
// @grant        none
// ==/UserScript==

const enableDebug = false;

(() => {
    const pageIdSel = document.querySelector(".favourite");
    if (!pageIdSel) return;

    const threadId = pageIdSel.dataset.target_id;
    const threadType = pageIdSel.dataset.target_type;
    const threadKey = `last_unread_${threadType}${threadId}`;

    const initLocalStorage = (key, defaultValue) => {
        if (localStorage[key] === undefined) localStorage[key] = defaultValue;
    };

    initLocalStorage(`${threadKey}_prev`, "[]");
    initLocalStorage(`${threadKey}_now`, "[]");
    initLocalStorage(`${threadKey}_last_prev`, "0");
    initLocalStorage(`${threadKey}_last_now`, "0");

    const log = (message) => { if (enableDebug) console.log(message); };

    const getUnread = () => {
        const currentUnread = [...document.querySelectorAll(".comment-new")].map(a => a.dataset.id);
        log(`tabun-restore-unread::currentUnread: ${currentUnread.toString()}`);
        return currentUnread;
    };

    const saveUnread = () => {
        const currentUnread = JSON.stringify(getUnread());
        if (localStorage[`${threadKey}_now`] === currentUnread) return;

        log(`tabun-restore-unread::saveUnread(prev: ${JSON.parse(localStorage[`${threadKey}_now`])}, now: ${currentUnread})`);
        
        localStorage[`${threadKey}_prev`] = localStorage[`${threadKey}_now`];
        localStorage[`${threadKey}_now`] = currentUnread;

        const counter = document.getElementById("new_comments_counter");
        if (counter) {
            localStorage[`${threadKey}_last_prev`] = localStorage[`${threadKey}_last_now`];
            localStorage[`${threadKey}_last_now`] = counter.dataset.idCommentLast;
        }
    };

    const restoreUnread = () => {
        const commentsToRestore = JSON.parse(localStorage[`${threadKey}_now`]) || JSON.parse(localStorage[`${threadKey}_prev`]);
        const commentLast = localStorage[`${threadKey}_last_now`] || localStorage[`${threadKey}_last_prev`];

        log(`tabun-restore-unread::restoreUnread(toRestore: ${commentsToRestore})`);

        commentsToRestore.forEach(comment => {
            const commentNode = document.getElementById(`comment_id_${comment}`);
            if (commentNode) commentNode.classList.add("comment-new");
        });

        const counter = document.getElementById("new_comments_counter");
        if (counter) {
            counter.dataset.idCommentLast = commentLast;
            const commentsCount = getUnread().length;
            counter.classList.toggle("h-hidden", commentsCount === 0);
            counter.innerHTML = commentsCount > 0 ? commentsCount : "";
        }
        return false;
    };

    saveUnread();
    const commentsNode = document.querySelector('#content-wrapper');
    if (commentsNode) new MutationObserver(saveUnread).observe(commentsNode, { childList: true, subtree: true, attributes: true });

    const rightPad = document.getElementById("update-comments");
    if (!rightPad) return;
    
    const button = document.createElement("i");
    button.id = "restore-comments";
    button.classList.add("update-comments");
    button.style.cssText = "background: url(https://static.everypony.ru/icons-synio.74234a99d817ffbad12103b32393ee10.png) -131px -71px no-repeat; margin: 1px 1px -5px -5px; transform: scale(-1, 1);";
    rightPad.before(button);
    button.onclick = restoreUnread;
})();
