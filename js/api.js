(function() {
    var counter = 1;
    
    var postapi = {
		options : {
			url :   "http://example2.com/~solarhess/postapi",
			apiUrl :   "http://example2.com/~solarhess/postapi/api.html"
		},

		/*************************
		 *    PRIVATE METHODS    *
		 *************************/
		_create : function(){
		    var $this = this;
		    $this.$panel = $this.element;

		    /* Map options to $this.optionName instead of $this.options.optionName */
		    $.each($this.options, function(k,v){
		        $this[k] = v;
		    });

		    // ensure that URL ends with a / character
		    if(! /\/$/.exec($this.url)) {
		        $this.url += "/";
		    }
		    
		    $this.requests = {};
		    $this.counter = counter++;

		    $this.$iframe = $('<iframe src="'+$this.apiUrl+'"> </iframe>');
		    $this.$panel.append($this.$iframe);

		    $this.$iframe.css("position", "fixed");
		    $this.$iframe.css("left", "-100px");
		    $this.$iframe.css("top", "-100px");
		    $this.$iframe.css("width", "1px");
		    $this.$iframe.css("height", "1px");
		},

		_init : function() {
		    var $this = this;
		    $(window).unbind('message.postapi'+$this.counter);
            $(window).bind('message.postapi'+$this.counter, function(evt) {
                
                var message = JSON.parse(evt.originalEvent.data);
        		if(message.from == "postapi" && message.type) {
        		    $this._messageReceived(message);
        		}
            });
            
        },
        
        _messageReceived : function(message) {
            if(message.type == "AjaxResponseSuccess") {
                this._handleResponseSuccess(message);
            }
            if(message.type == "AjaxResponseError") {
                this._handleResponseError(message);
            }
            if(message.type == "AjaxResponseComplete") {
                this._handleResponseComplete(message);
            }
        },
        _getAjaxOptions : function(requestId) {
            var ajaxOptions = this.requests[requestId];
            this.requests[requestId] = null;
            return ajaxOptions
        },
        _handleResponseSuccess : function(message) {
            var ajaxOptions = this._getAjaxOptions(message.requestId);
            if(ajaxOptions) {
                ajaxOptions.success(message.data);
            }
        },
        _handleResponseError : function(message) {
            var ajaxOptions = this._getAjaxOptions(message.requestId);
            if(ajaxOptions) {
                ajaxOptions.error(message.jqxhr, message.data);
            }
        },
        _handleResponseComplete : function(message) {
            var ajaxOptions = this._getAjaxOptions(message.requestId);
            if(ajaxOptions) {
                ajaxOptions.complete(message.jqxhr, message.data);
            }
        },

        _generateId : function() {
            return "postapi_"+(new Date()).getTime()+"_"+Math.random();
        },
        
        sendRequest : function(ajaxOptions) {
            var $this = this,
                requestId = this._generateId(),
                message = "", 
                newOptions = {};
                
            $.each(ajaxOptions, function(k,v){
                if(typeof v != 'function') {
                    newOptions[k] = v;
                } else {
                    newOptions[k] = true;
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
        }
        
    }

    $.widget( 'ui.postapi', postapi);
})();
