(function() {

    $(window).bind('message.postapi', function(evt) {
        var message = JSON.parse(evt.originalEvent.data);
        if(message.from == "postapi" && message.type) {
            _messageReceived(message);
        }
    });
    
    function _messageReceived(message) {
        if(message.type = "AjaxRequest") {
            _ajaxRequest(message);
        }
    }
    
    function _ajaxRequest(message) {
        if(message.ajaxOptions.error) {
            message.ajaxOptions.error = function(jqxhr, data) {
                _error(message.requestId, jqxhr, data)
            };
        }
        if(message.ajaxOptions.success) {
            message.ajaxOptions.success = function(data) {
                _success(message.requestId, data)
            };
        }        
        if(message.ajaxOptions.complete) {
            message.ajaxOptions.complete = function(jqxhr, data) {
                _complete(message.requestId, jqxhr, data)
            };
        }        
        $.ajax(message.ajaxOptions);
    }

    function _error(requestId, jqxhr, data) {
        var responseMessage = {
            "from":"postapi",
            "type":"AjaxResponseError",
            "requestId" : requestId,
            "jqxhr" : jqxhr,
            "data" : data,
        };
        window.parent.postMessage(JSON.stringify(responseMessage),"*");
    }
    function _success(requestId, data) {
        var responseMessage = {
            "from":"postapi",
            "type":"AjaxResponseSuccess",
            "requestId" : requestId,
            "data" : data
        };
        window.parent.postMessage(JSON.stringify(responseMessage),"*");
    }
    function _complete(requestId, jqxhr, data) {
        var responseMessage = {
            "from":"postapi",
            "type":"AjaxResponseComplete",
            "requestId" : requestId,
            "data" : data,
            "jqxhr": jqxhr
        };
        window.parent.postMessage(JSON.stringify(responseMessage),"*");
    }
})();