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

(() =>
{
    var pageIdSel = document.querySelector(".favourite");
    if (pageIdSel == null) return;
    var threadId = pageIdSel.dataset.target_id;
    var threadType = pageIdSel.dataset.target_type;
    var threadKey = "last_unread_" + threadType + threadId
    if (localStorage[threadKey + "_prev"] == undefined) localStorage[threadKey + "_prev"] = "[]";
    if (localStorage[threadKey + "_now"] == undefined) localStorage[threadKey + "_now"] = "[]";
    if (localStorage[threadKey + "_last_prev"] == undefined) localStorage[threadKey + "_last_prev"] = "0";
    if (localStorage[threadKey + "_last_now"] == undefined) localStorage[threadKey + "_last_now"] = "0";
    if (enableDebug) console.log("tabun-restore-unread::threadKey: " + threadKey);

    function getUnread()
    {
        var currentUnread = [];
        document.querySelectorAll(".comment-new").forEach((a) => {currentUnread.push(a.dataset.id);});
        if (enableDebug) console.log("tabun-restore-unread::currentUnread: " + currentUnread.toString());
        return currentUnread;
    }

    function saveUnread()
    {
        // Don't save if there's no change
        var currentUnread = JSON.stringify(getUnread());
        if (localStorage[threadKey + "_now"] == currentUnread) return;

        if (enableDebug) console.log("tabun-restore-unread::saveUnread(prev: " + JSON.parse(localStorage[threadKey + "_now"]) + ", now: " + currentUnread + ")");

        // Save current unread list
        localStorage[threadKey + "_prev"] = localStorage[threadKey + "_now"];
        localStorage[threadKey + "_now"] = currentUnread;

        // Save data for comments counter
        var counter = document.getElementById("new_comments_counter");
        if (counter == null) return;
        localStorage[threadKey + "_last_prev"] = localStorage[threadKey + "_last_now"];
        localStorage[threadKey + "_last_now"] = counter.dataset.idCommentLast;
    }

    function restoreUnread()
    {
        // If current == "now", restore "prev", else restore "now".
        var commentsToRestore = localStorage[threadKey + "_now"];
        var commentLast = localStorage[threadKey + "_last_now"];
        if (commentsToRestore == JSON.stringify(getUnread()))
        {
            commentsToRestore = localStorage[threadKey + "_prev"];
            commentLast = localStorage[threadKey + "_last_prev"];
        }

        if (enableDebug) console.log("tabun-restore-unread::restoreUnread(toRestore: " + commentsToRestore + ")");

        // Restore class for every comment
        var restoredUnread = JSON.parse(commentsToRestore);
        restoredUnread.forEach((comment) =>
        {
            var commentNode = document.getElementById("comment_id_" + comment);
            if (commentNode != null) commentNode.classList.add("comment-new");
        });

        // Update new comments counter
        var counter = document.getElementById("new_comments_counter");
        if (counter == null) return;
        counter.dataset.idCommentLast = commentLast;

        // Show counter if comments number is not 0
        var commentsCount = getUnread().length;
        if (commentsCount > 0)
        {
            counter.classList.remove("h-hidden");
            counter.innerHTML = commentsCount;
        }
        else
        {
            counter.classList.add("h-hidden");
            counter.innerHTML = "";
        }
        return false;
    }

    // Save initial state and add an observer to save when it changes
    saveUnread();
    var commentsNode = document.querySelector('#content-wrapper');
    if (commentsNode) new MutationObserver(saveUnread).observe(commentsNode, {childList: true, subtree: true, attributes: true});

    // Add a button to restore unread comments
    var rightPad = document.getElementById("update-comments");
    if (rightPad == null) return;
    var button = document.createElement("i");
    button.id = "restore-comments";
    button.classList.add("update-comments");
    button.style.background = "url(https://static.everypony.ru/icons-synio.74234a99d817ffbad12103b32393ee10.png) -131px -71px no-repeat";
    button.style.margin = "1px 1px -5px -5px";
    button.style.transform = "scale(-1, 1)";
    rightPad.before(button);
    button.onclick = restoreUnread;
})();
