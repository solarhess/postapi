(function() {
    var counter = 1;
    
    /**
     *
     */
    var postapi = {
		options : {
			url :   "http://example2.com/~solarhess/postapi",
			apiUrl :   "http://example2.com/~solarhess/postapi/api.html",
			oauthAuthorizationUrl : null,
			oauthTokenUrl : null,
			oauthClientId : null,
			oauthClientSecret : "",
			oauthCode : null,
			oauthToken : null,
			oauthRedirectUri : null,
			oauthScope : "read",
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
            
            if(this.oauthCode) {
                this._finishAuthorization();
            } 
            if(this.oauthToken) {
                this.oauthTokenData = {
                    access_token: this.oauthToken, 
                    token_type: "bearer",
                    scope: $this.oauthScope
                }
            }
        },
        
        _finishAuthorization : function() {
            var $this = this;
            this.sendRequest({
                url: this.oauthTokenUrl,
                type: "POST",
                dataType: "json",
				data: {
				    grant_type: "authorization_code",
				    code: this.oauthCode,
				    redirect_uri: this.oauthRedirectUri,
				    scope: $this.oauthScope,
				    username: this.oauthClientId,
				    password: this.oauthClientSecret
				},
				success : function(data) {
				    $this._handleOAuthTokenResponse(data);
				}
            })
        },
        
        _getOAuthAccessToken : function() {
            if(this.oauthTokenData) {
                return this.oauthTokenData.access_token;
            }
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
        
        _handleOAuthTokenResponse : function(data) {
            this.oauthTokenData = data;
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
		    
		    if(! /^http(s?)/.exec(newOptions.url)) {
    		    newOptions.url = $this.url + newOptions.url;
		    }

		    if(this._getOAuthAccessToken()) {
    		    if(! newOptions.headers) {
    		        newOptions.headers = {};
    		    }
    		    newOptions.headers["Authorization"] = "Bearer " + this._getOAuthAccessToken();
		    }
		    
		    
		    message = JSON.stringify({
                from: 'postapi',
                type: 'AjaxRequest',
                requestId: requestId,
                ajaxOptions : newOptions
            });
    		
            $this.requests[requestId] = ajaxOptions;
            $this.$iframe[0].contentWindow.postMessage(message, this.url);
        },

        authorizeWithToken : function() {
            var authUrl = this.oauthAuthorizationUrl +  "?response_type=token&" + 
                    "client_id=" + this.oauthClientId +
                    "&scope=read" + 
                    "&redirect_uri=" + this.oauthRedirectUri;
            window.location = authUrl;
        },

        authorizeWithCode : function() {
            var authUrl = this.oauthAuthorizationUrl +  "?response_type=code&" + 
                    "client_id=" + this.oauthClientId +
                    "&scope=read" + 
                    "&redirect_uri=" + this.oauthRedirectUri;
            window.location = authUrl;            
        }
                
    }

    $.widget( 'ui.postapi', postapi);
})();
