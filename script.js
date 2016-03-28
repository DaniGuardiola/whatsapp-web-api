/* global console */
"use strict";
var API = (function() {

    // VARIABLES
    var parsingDate;
    var elements = {};
    elements.app = document.querySelector(".app-wrapper > .app");

    function refreshConversationElements() {
        elements.msgList = elements.app.querySelector(".message-list");
    }

    function getConversationMessageElements() {
        refreshConversationElements();
        return elements.msgList.querySelectorAll(".message");
    }

    function parseConversationMessageElements(collection) {
        var messages = [];
        for (var i = 0; i < collection.length; i++) {
            if (collection[i].classList.contains("message-system")) {
                parseDateSystemMessage(collection[i]);
            } else {
                messages.push(parseMessageElement(collection[i]));
            }
        }
        parsingDate = null;
        return messages;
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
        // image with caption
        if (message.type === "chat" || (message.type === "image" && element.querySelector(".bubble-image-caption"))) {
            message.text = getText(element);
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

    function getConversationMessages() {
        return parseConversationMessageElements(getConversationMessageElements());
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
        var msgs = getConversationMessages();
        for (var i = 0; i < msgs.length; i++) {
            console.log(DumpObjectIndented(msgs[i], "    "));
            console.log(msgs[i].datetime);
        }
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
        DEBUGshowCurrentConversationMessages: DEBUGshowCurrentConversationMessages
    };
}());
