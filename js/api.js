(function() {
    var postapi = {
		options : {
			url :   "http://example2.com/~solarhess/postapi"
		},

		/*************************
		 *    PRIVATE METHODS    *
		 *************************/
		_create : function(){
		    var $this = this;
		    $this.$iframe = $this.element;

		    /* Map options to $this.optionName instead of $this.options.optionName */
		    $.each($this.options, function(k,v){
		        $this[k] = v;
		    });

		    // ensure that URL ends with a / character
		    if(! /\/$/.exec($this.url)) {
		        $this.url += "/";
		    }
		    
		    $this.requests = {};
		},

		_init : function() {
		    var $this = this;
		    $(window).unbind('message.postapi');
            $(window).bind('message.postapi', function(evt) {
                
                var message = JSON.parse(evt.originalEvent.data);
        		if(message.from == "postapi" && message.type) {
        		    $this._messageReceived(message);
        		}
            });
        },
        
        _messageReceived : function(message) {
            if(message.type == "AjaxResponse") {
                this._handleResponse(message);
            }
            if(message.type == "AjaxResponseError") {
                this._handleResponseError(message);
            }
        },
        _getAjaxOptions : function(requestId) {
            var ajaxOptions = this.requests[requestId];
            this.requests[requestId] = null;
            return ajaxOptions
        },
        _handleResponse : function(message) {
            var ajaxOptions = this._getAjaxOptions(message.requestId);
            if(ajaxOptions) {
                ajaxOptions.success(message.data);
            }
        },
        _handleResponseError : function(message) {
            var ajaxOptions = this._getAjaxOptions(message.requestId);
            if(ajaxOptions) {
                ajaxOptions.error(message.jqxhr);
            }
        },

        _generateId : function() {
            return "postapi_"+(new Date()).getTime();
        },
        
        sendRequest : function(ajaxOptions) {
            var $this = this,
                requestId = this._generateId(),
                message = "", 
                newOptions = {};
                
            $.each(ajaxOptions, function(k,v){
                if(typeof v != 'function') {
                    newOptions[k] = v;
                }
		    });
		    
		    newOptions.url = $this.url + newOptions.url;
		    
		    message = JSON.stringify({
                from: 'postapi',
                type: 'AjaxRequest',
                requestId: requestId,
                ajaxOptions : newOptions
            });
    		
            $this.requests[requestId] = ajaxOptions;
            $this.$iframe[0].contentWindow.postMessage(message,"*");
        },
        
    }

    $.widget( 'ui.postapi', postapi);
})();
