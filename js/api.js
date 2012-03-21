(function() {
    var counter = 1;
    function unparam(value) {
        var
        // Object that holds names => values.
        params = {},
        // Get query string pieces (separated by &)
        pieces = value.split('&'),
        // Temporary variables used in loop.
        pair, i, l;

        // Loop through query string pieces and assign params.
        for (i = 0, l = pieces.length; i < l; i++) {
            pair = pieces[i].split('=', 2);
            // Repeated parameters with the same name are overwritten. Parameters
            // with no value get set to boolean true.
            params[decodeURIComponent(pair[0])] = (pair.length == 2 ?
                decodeURIComponent(pair[1].replace(/\+/g, ' ')) : true);
        }

        return params;
    };
    
    function _tokenHashParam() {
        return unparam(window.location.hash.slice(1)).access_token;
    }
    function _codeParam() {
        return unparam(window.location.search.slice(1)).code;
    }
    function _redirectUri() {
        var uri = window.location.href;
        var indexOfHash = uri.indexOf('#');
        var indexOfSearch = uri.indexOf('?');
        if(indexOfHash >= 0 && indexOfSearch >= 0) {
            uri = uri.substring(0, Math.min(indexOfHash, indexOfSearch));
        } else if (indexOfHash >= 0 || indexOfSearch >= 0){
            uri = uri.substring(0, Math.max(indexOfHash, indexOfSearch));
        } else {
            // uri = uri
        }
        
        return uri;
    }

    function PostAPI(options) {
        this._create(options);
        this._init();
    }

    
    /**
     *
     */
    PostAPI.prototype = {
        _defaultOptions : function() {
            return {
                url :   "http://example2.com/~solarhess/postapi",
                postapiUrl :   "http://example2.com/~solarhess/postapi/api.html",
                oauthAuthorizationUrl : null,
                oauthTokenUrl : null,
                oauthClientId : null,
                oauthClientSecret : "",
                oauthScope : "read",
                oauthToken : _tokenHashParam(),
                oauthCode : _codeParam(),
                oauthRedirectUri : _redirectUri()
            }
        },
        /*************************
         *    PRIVATE METHODS    *
         *************************/
        _create : function(options){
            var $this = this;
            
            /* Map default options to $this.optionName */
            $.each($this._defaultOptions(), function(k,v){
                $this[k] = v;
            });
            

            /* Map user-defined options to $this.optionName*/
            $.each(options, function(k,v){
                $this[k] = v;
            });

            // ensure that URL ends with a / character
            if(! /\/$/.exec($this.baseurl)) {
                $this.baseurl += "/";
            }
            
            $this.requests = {};
            $this.counter = counter++;

            $this.$iframe = $('<iframe src="'+$this.postapiUrl+'"> </iframe>');

            $this.$iframe.css("position", "fixed");
            $this.$iframe.css("left", "-100px");
            $this.$iframe.css("top", "-100px");
            $this.$iframe.css("width", "1px");
            $this.$iframe.css("height", "1px");

            document.body.appendChild($this.$iframe.get(0));
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
                username: this.oauthClientId,
                password: this.oauthClientSecret,
                data: {
                    grant_type: "authorization_code",
                    code: this.oauthCode,
                    redirect_uri: this.oauthRedirectUri,
                    scope: $this.oauthScope
                },
                success : function(data) {
                    $this._handleOAuthTokenResponse(data);
                }
            });
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
                newOptions.url = $this.baseurl + newOptions.url;
            }

            if(this._getOAuthAccessToken() &&  ! ajaxOptions.username) {
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
            $this.$iframe[0].contentWindow.postMessage(message, this.baseurl);
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
        },
        
        authorizeWithPassword : function(username, password) {
            var $this = this;
            this.sendRequest({
                url: this.oauthTokenUrl,
                type: "POST",
                dataType: "json",
                data: {
                    grant_type: "password",
                    username: username,
                    password: password,
                    scope: $this.oauthScope
                },
                success : function(data) {
                    $this._handleOAuthTokenResponse(data);
                }
            });
        }
    }

    if(typeof window.PostAPI == 'undefined') {
        window.PostAPI = PostAPI
    }
    
})();
