/* global console */
"use strict";
var API = (function() {
    var parsingDate;
    var elements = {};
    elements.app = document.querySelector(".app-wrapper > .app");

    function refreshElements() {
        elements.msgList = elements.app.querySelector(".message-list");
    }

    function getMessageElements() {
        refreshElements();
        return elements.msgList.querySelectorAll(".message");
    }

    function parseDateMessage(element) {
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
        if (dateText === "today") {
            parsingDate = date;
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

        console.log("PARSING DATE CHANGED TO:");
        console.log(parsingDate.day + "/" + parsingDate.month + "/" + parsingDate.year);
    }

    function parseMessageElements(collection) {
        var messages = [];
        for (var i = 0; i < collection.length; i++) {
            if (collection[i].classList.contains("message-system")) {
                parseDateMessage(collection[i]);
            } else {
                messages.push(parseMessageElement(collection[i]));
            }
        }
        parsingDate = null;
        return messages;
    }

    function parseMessageElement(element) {
        var message = {};
        var tmp, tmp2;

        // Date and time
        message.datetime = parseTime(element.querySelector(".message-meta .message-datetime").textContent);

        // Direction (in or out)
        if (element.classList.contains("message-in")) {
            message.direction = "in";
        } else if (element.classList.contains("message-out")) {
            message.direction = "out";
        } else {
            throw "Direction of message could not be parsed";
        }

        // Type ()
        if (element.classList.contains("message-chat")) {
            message.type = "chat";
        } else {
            console.log("Message type not supported yet. Ignoring.");
            return {};
        }

        // Type chat specifics
        if (message.type === "chat") {
            tmp = element.querySelector(".message-text .selectable-text").cloneNode(true);
            tmp2 = tmp.querySelectorAll("img");
            for (var i = 0; i < tmp2.length; i++) {
                tmp.replaceChild(document.createTextNode(tmp2[i].alt), tmp2[i]);
            }
            message.text = tmp.innerHTML;
        }

        tmp = tmp2 = null;

        return message;
    }

    function parseTime(string) {
        string = string.split(" ");
        var ampm = string[1];
        string = string[0].split(":");
        var hour = string[0];
        var minute = string[1];
        if (ampm.toLowerCase() === "pm") {
            hour = hour + 12;
        }
        return new Date(parsingDate.year, parsingDate.month, parsingDate.day, hour, minute);
    }

    function getMessages() {
        return parseMessageElements(getMessageElements());
    }

    function DEBUGshowCurrentConversationText() {
        var msgs = getMessages();
        for (var i = 0; i < msgs.length; i++) {
            console.log(msgs[i].datetime);
            console.log(msgs[i].text);
        }
    }

    return {
        getMessages: getMessages,
        DEBUGshowCurrentConversationText: DEBUGshowCurrentConversationText
    };
}());
