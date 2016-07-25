/* global console */
"use strict";

/* 
    WHATSAPP WEB API (UNOFFICIAL)
    github.com/DaniGuardiola/whatsapp-web-api
*/
var API = (function() {

    // VARIABLES
    var parsingDate;
    var elements = {};

    function refreshConversationElements() {
        elements.app = document.querySelector(".app-wrapper > .app");
        elements.msgList = elements.app.querySelector(".message-list");
    }

    function getConversationMessageElements() {
        refreshConversationElements();
        return elements.msgList.querySelectorAll(".message");
    }

    function parseMessageElements(collection, asyncTasks) {
        var promise = new Promise(function(resolve) {
            var messages = [];
            var message;
            var promises = [];

            var func = function(arrayIndex) {

                // Images
                if (message.type === "image") {
                    if (message.loaded) {
                        promises.push(loadImageAsync(message.url).then(function(image) {
                            messages[arrayIndex].blob = image;
                        }));
                    }
                }
            };

            for (var i = 0; i < collection.length; i++) {
                if (collection[i].classList.contains("message-system")) {
                    parseDateSystemMessage(collection[i]);
                } else {
                    message = parseMessageElement(collection[i]);
                    var index = messages.push(message) - 1;

                    // Async tasks
                    if (asyncTasks) {
                        (func)(index);
                    }
                }
            }
            parsingDate = null;
            Promise.all(promises).then(function() {
                resolve(messages);
            });
        });
        return promise;
    }

    /* ASYNC TASKS */
    function loadImageAsync(url) {
        var promise = new Promise(function(resolve) {
            var x = new XMLHttpRequest();
            x.open('GET', url);
            x.responseType = 'blob';
            x.onload = function() {
                var blob = x.response;
                var fr = new FileReader();
                fr.onloadend = function() {
                    resolve(fr.result);
                };
                fr.readAsDataURL(blob);
            };
            x.send();
        });
        return promise;
    }

    function parseDateSystemMessage(element) {
        var weekdayI, difference, date2;
        var weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        var today = new Date();
        var date = {
            day: today.getDate(),
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            weekday: today.getDay()
        };
        var dateText = element.querySelector(".message-system-body .emojitext").textContent.toLowerCase();

        // TODAY
        if (dateText === "today") {
            parsingDate = date;

            // YESTERDAY
        } else if (weekdays.indexOf(dateText) > -1 || dateText === "yesterday") {
            if (weekdays.indexOf(dateText) > -1) {
                weekdayI = weekdays.indexOf(dateText);
                if (weekdayI >= date.weekday) {
                    difference = 7 - (weekdayI - date.weekday);
                } else {
                    difference = date.weekday - weekdayI;
                }
            }

            if (dateText === "yesterday") {
                difference = 1;
            }

            date2 = new Date();
            date2.setDate(today.getDate() - difference);
            parsingDate = {
                day: date2.getDate(),
                month: date2.getMonth() + 1,
                year: date2.getFullYear(),
                weekday: date2.getDay()
            };

            // XX/XX/XXXX
        } else {
            dateText = dateText.split("/");
            date2 = new Date(dateText[2], dateText[0] - 1, dateText[1]);
            parsingDate = {
                day: date2.getDate(),
                month: date2.getMonth() + 1,
                year: date2.getFullYear(),
                weekday: date2.getDay()
            };
        }
    }

    function parseMessageElement(element) {
        var message = {};

        // Direction:
        // - in
        // - out
        message.direction = getMessageDirection(element);

        // Type:
        // - link
        // - chat
        // - contact
        // - location
        // - video
        // - image
        // - audio
        // - music
        // - unknown
        message.type = getMessageType(element);

        // Date() instance
        message.datetime = getDatetime(element);

        // Human-readable date
        // DD/MM/YYYY
        message.date = ("0" + message.datetime.getDate()).slice(-2) + "/" + ("0" + (message.datetime.getMonth() + 1)).slice(-2) + "/" + message.datetime.getUTCFullYear();

        // Human-readable time
        // HH:MM
        message.time = ("0" + message.datetime.getHours()).slice(-2) + ":" + ("0" + message.datetime.getMinutes()).slice(-2);

        // Timezone offset of human readable date and time
        // HH:MM
        message.timezoneOffset = message.datetime.getTimezoneOffset();

        // Get text for type:
        // - chat
        // - link
        // - image (with caption)
        if (message.type === "link" || message.type === "chat" || (message.type === "image" && element.querySelector(".bubble-image-caption"))) {
            message.text = getText(element);
        }

        // Get load status for type:
        // - image
        if (message.type === "image") {
            message.loaded = getImageIsLoaded(element);
            if (!message.loaded) {
                message.loading = getImageIsLoading(element);
            }
        }

        // Get url for type:
        // - image (loaded)
        if (message.type === "image" && message.loaded) {
            message.url = getImageUrl(element);
        }

        return message;
    }

    function getMessageDirection(element) {
        if (element.classList.contains("message-in")) {
            return "in";
        }
        if (element.classList.contains("message-out")) {
            return "out";
        }
        throw "Direction of message could not be parsed";
    }

    function getMessageType(element) {
        if (element.querySelector(".link-preview-container")) {
            return "link";
        }
        if (element.classList.contains("message-chat")) {
            return "chat";
        }
        if (element.querySelector(".bubble-contact")) {
            return "contact";
        }
        if (element.querySelector(".bubble-location")) {
            return "location";
        }
        if (element.querySelector(".icon-msg-video-light")) {
            return "video";
        }
        if (element.querySelector("img")) {
            return "image";
        }
        if (element.querySelector(".audio")) {
            return "audio";
        }
        if (element.querySelector(".icon-msg-audio-light")) {
            return "music";
        }
        console.warn("Message type not supported yet. Ignoring.");
        return "unknown";
    }

    function getDatetime(element) {
        var string = element.querySelector(".message-meta .message-datetime").textContent;
        string = string.split(" ");
        var ampm = string[1];
        string = string[0].split(":");
        var hour = +string[0];
        var minute = +string[1];
        if (ampm.toLowerCase() === "pm") {
            hour = 12 + hour;
        }
        return new Date(parsingDate.year, parsingDate.month - 1, parsingDate.day, hour, minute);
    }

    function getText(element) {
        var clone = element.querySelector(".message-text .selectable-text").cloneNode(true);
        var emojis = clone.querySelectorAll("img");
        for (var i = 0; i < emojis.length; i++) {
            clone.replaceChild(document.createTextNode(emojis[i].alt), emojis[i]);
        }
        return clone.innerHTML;
    }

    function getImageIsLoaded(element) {
        return !element.querySelector(".media-state-controls");
    }

    function getImageIsLoading(element) {
        // WARNING
        // This method will also return true
        // if the image is loaded
        return !element.querySelector(".btn-meta");
    }

    function getImageUrl(element) {
        return element.querySelector("img").src;
    }

    function getConversationMessages() {
        return parseMessageElements(getConversationMessageElements(), true);
    }

    function DEBUGshowCurrentConversationText() {
        var msgs = getConversationMessages();
        for (var i = 0; i < msgs.length; i++) {
            var m = msgs[i].datetime;
            var dateString =
                ("0" + m.getDate()).slice(-2) + "/" +
                ("0" + (m.getMonth() + 1)).slice(-2) + "/" +
                m.getUTCFullYear() + " " +
                ("0" + m.getHours()).slice(-2) + ":" +
                ("0" + m.getMinutes()).slice(-2);
            console.log(dateString);
            console.log(msgs[i].text);
        }
    }

    function DEBUGshowCurrentConversationMessages() {
        getConversationMessages().then(function(msgs) {
            for (var i = 0; i < msgs.length; i++) {
                console.log(DumpObjectIndented(msgs[i], "    "));
                console.log(msgs[i].datetime);
            }
        });
    }

    function DEBUGshareCurrentConversationMessages() {
        getConversationMessages().then(function(msgs) {
            var http = new XMLHttpRequest();
            var url = "http://capturechat.cloud.tilaa.com:3001/api/captures";
            var data = {
                userid: 0,
                messages: msgs
            };

            http.open("POST", url, true);

            //Send the proper header information along with the request
            http.setRequestHeader("Content-type", "application/json");
            http.setRequestHeader("Accept", "application/json");

            http.onreadystatechange = function() { //Call a function when the state changes.
                if (http.readyState == 4 && http.status == 200) {
                    console.log("SAVED!!!!!!!!!");
                    console.log(http.responseText);
                }
            };
            http.send(JSON.stringify(data));
        });
    }

    function DumpObjectIndented(obj, indent) {
        var result = "";
        if (indent === null) indent = "";

        for (var property in obj) {
            var value = obj[property];
            if (typeof value == 'string')
                value = "'" + value + "'";
            else if (typeof value == 'object') {
                if (value instanceof Array) {
                    // Just let JS convert the Array to a string!
                    value = "[ " + value + " ]";
                } else {
                    // Recursive dump
                    // (replace "  " by "\t" or something else if you prefer)
                    var od = DumpObjectIndented(value, indent + "  ");
                    // If you like { on the same line as the key
                    //value = "{\n" + od + "\n" + indent + "}";
                    // If you prefer { and } to be aligned
                    value = indent + od + "\n" + indent;
                }
            }
            result += indent + property + " : " + value + "\n";
        }
        return result.replace(/,\n$/, "");
    }

    return {
        getConversationMessages: getConversationMessages,
        DEBUGshowCurrentConversationText: DEBUGshowCurrentConversationText,
        DEBUGshowCurrentConversationMessages: DEBUGshowCurrentConversationMessages,
        DEBUGshareCurrentConversationMessages: DEBUGshareCurrentConversationMessages
    };
}());

/* CAPTURECHAT CHROME EXTENSION */
(function() {
    function buttonClickListener(event) {
        API.DEBUGshareCurrentConversationMessages();
    }

    // Add a button
    function addButton() {
        var container = document.querySelector(".pane-chat-controls>.menu");
        var item = document.createElement("div");
        item.classList.add("menu-item", "social-screencap-button");
        var button = document.createElement("button");
        button.classList.add("icon", "capturechat");
        button.setAttribute("title", "Convert to image");
        item.appendChild(button);
        button.addEventListener("click", buttonClickListener);

        container.insertBefore(item, container.children[0]);
    }

    // App load callback
    function chatLoadObserver() {
        // Observe body for app wrapper
        function observeBody() {
            var observerBody = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length > 0) {
                        for (var i = mutation.addedNodes.length - 1; i >= 0; i--) {
                            if (mutation.addedNodes[i].classList &&
                                mutation.addedNodes[i].id === "main") {
                                addButton();
                                break;
                            }
                        }
                    }
                });
            });
            observerBody.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        observeBody();
    }

    // Initializes the script
    function init() {
        chatLoadObserver();
    }

    init();
}());
