"use strict";
var API = (function() {
    // PRIVATE VARIABLES
    var elements = {};
    elements.app = document.querySelector(".app-wrapper > .app");

    function refreshElements() {
        elements.msgList = elements.app.querySelector(".message-list");
    }

    function getMessageElements() {
        refreshElements();
        return elements.msgList.querySelectorAll(".message");
    }

    function parseMessageElements(collection) {

    }

    function parseMessageElement(element) {
    	var message = {};

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
    	} else if (element.classList.contains("message-out")) {
    		message.direction = "out";    		
    	} else {
    		throw "Direction of message could not be parsed";
    	}
    }

    function getMessages() {
    	return parseMessageElements(getMessageElements());
    }

    return {
        getCurrentMessages: getCurrentMessages
    };
}());
