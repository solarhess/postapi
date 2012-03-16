(function() {
//    window.parent.postMessage('{"from":"postapi","type":"PostApiReady"}',"*")

    $(window).bind('message.postapi', function(evt) {
        var message = JSON.parse(evt.originalEvent.data);
        if(message.from == "postapi" && message.type) {
            _messageReceived(message);
        }
    });
    
    function _messageReceived(message) {
        console.log("Engine Message Received");
        console.log(message);
        
        if(message.type = "AjaxRequest") {
            _ajaxRequest(message);
        }
    }
    
    function _ajaxRequest(message) {
        message.ajaxOptions.error = function(jqxhr) {
            _error(message.requestId, jqxhr)
        };
        message.ajaxOptions.success = function(data) {
            _success(message.requestId, data)
        };
        
        $.ajax(message.ajaxOptions);
    }

    function _error(requestId, jqxhr) {
        var responseMessage = {
            "from":"postapi",
            "type":"AjaxResponseError",
            "requestId" : requestId,
            "jqxhr" : jqxhr
        };
        window.parent.postMessage(JSON.stringify(responseMessage),"*");
    }
    function _success(requestId, data) {
        var responseMessage = {
            "from":"postapi",
            "type":"AjaxResponse",
            "requestId" : requestId,
            "data" : data
        };
        window.parent.postMessage(JSON.stringify(responseMessage),"*");
    }
})();