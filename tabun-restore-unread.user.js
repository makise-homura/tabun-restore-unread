// ==UserScript==
// @name         Восстановление непрочитанных комментов на Табуне
// @version      0.4
// @description  Добавляет возможность "вспомнить" непрочитанные комменты после случайного обновления или закрытия страницы
// @author       makise_homura, Brolks
// @match        https://tabun.everypony.ru/*
// @match        https://tabun.everypony.info/*
// @grant        none
// ==/UserScript==

const enableDebug = false;

(function() {
    var pageIdSel = document.querySelector(".favourite");
    if (!pageIdSel) return;

    var threadId = pageIdSel.dataset.target_id;
    var threadType = pageIdSel.dataset.target_type;
    var threadKey = 'last_unread_' + threadType + threadId;

    var initLocalStorage = function(key, defaultValue) {
        if (localStorage[key] === undefined) localStorage[key] = defaultValue;
    };

    initLocalStorage(threadKey + '_prev', "[]");
    initLocalStorage(threadKey + '_now', "[]");
    initLocalStorage(threadKey + '_last_prev', "0");
    initLocalStorage(threadKey + '_last_now', "0");

    var log = function(message) { if (enableDebug) console.log(message); };

    var getUnread = function() {
        var currentUnread = Array.from(document.querySelectorAll(".comment-new")).map(function(a) { return a.dataset.id; });
        log('tabun-restore-unread::currentUnread: ' + currentUnread.toString());
        return currentUnread;
    };

    var saveUnread = function() {
        var currentUnread = JSON.stringify(getUnread());
        if (localStorage[threadKey + '_now'] === currentUnread) return;

        log('tabun-restore-unread::saveUnread(prev: ' + JSON.parse(localStorage[threadKey + '_now']) + ', now: ' + currentUnread + ')');

        localStorage[threadKey + '_prev'] = localStorage[threadKey + '_now'];
        localStorage[threadKey + '_now'] = currentUnread;

        var counter = document.getElementById("new_comments_counter");
        if (counter) {
            localStorage[threadKey + '_last_prev'] = localStorage[threadKey + '_last_now'];
            localStorage[threadKey + '_last_now'] = counter.dataset.idCommentLast;
        }
    };

    var restoreUnread = function() {
        var commentsNow = getUnread();
        var commentsToRestore = JSON.parse(localStorage[threadKey + '_now']) || JSON.parse(localStorage[threadKey + '_prev']);
        var commentLast = localStorage[threadKey + '_last_now'] || localStorage[threadKey + '_last_prev'];

        var arraySame = function(arr1, arr2) {
            return arr1.length === arr2.length && arr1.every((v) => arr2.includes(v));
        }

        if (arraySame(commentsNow, commentsToRestore)) {
            commentsToRestore = JSON.parse(localStorage[threadKey + '_prev']);
            commentLast = localStorage[threadKey + '_last_prev'];
        }

        log('tabun-restore-unread::restoreUnread(toRestore: ' + commentsToRestore + ')');

        commentsToRestore.forEach(function(comment) {
            var commentNode = document.getElementById('comment_id_' + comment);
            if (commentNode) commentNode.classList.add("comment-new");
        });

        var counter = document.getElementById("new_comments_counter");
        if (counter) {
            counter.dataset.idCommentLast = commentLast;
            var commentsCount = getUnread().length;
            counter.classList.toggle("h-hidden", commentsCount === 0);
            counter.innerHTML = commentsCount > 0 ? commentsCount : "";
        }
        return false;
    };

    saveUnread();
    var commentsNode = document.querySelector('#content-wrapper');
    if (commentsNode) new MutationObserver(saveUnread).observe(commentsNode, { childList: true, subtree: true, attributes: true });

    var rightPad = document.getElementById("update-comments");
    if (!rightPad) return;

    var button = document.createElement("i");
    button.id = "restore-comments";
    button.classList.add("update-comments");
    button.style.cssText = "background: url(https://static.everypony.ru/icons-synio.74234a99d817ffbad12103b32393ee10.png) -131px -71px no-repeat; margin: 1px 1px -5px -5px; transform: scale(-1, 1);";
    rightPad.before(button);
    button.onclick = restoreUnread;
})();
