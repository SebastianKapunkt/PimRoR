//Cingelton Chat instance
var Chat = (function() {
    var instance;

    function init() {
        //PRIVAT
        var CLASS_CONVESATIONS_LIST = "conversation_list";
        var CLASS_CHAT_BOX_WRAPPER = "chat_box_wrapper";
        var CLASS_DASHBOARD_MESSAGE = "dashboard-messages";
        var ID_CHAT_BOX_MESSAGE = "chat_box_message_";
        var CLASS_CHAT_BOX_CONTENT = "chat_box_content";
        var CLASS_CHAT_BOX_TEXTAREA = "chat_box_textarea";
        var CLASS_CHAT_BOX_MESSAGE_STATUS = "chat_box_message_status";
        var CLASS_SEARCH_LIST = "chat-user-search-result";
        var PATH_CONVERSATIONS = "conversations/";
        var PATH_MESSAGES = "/messages";
        var currentConversation = null;

        function notifyNewMessage(name) {
            toastr['info']("Neue Nachricht von " + name);
        }
        function setPersonOnline () {
            $('.chat_box_head .status').text('Online');
        }

        function setConversationList(html) {
            $("." + CLASS_CONVESATIONS_LIST).html(html);
        }

        function setConversationLandingPage(html) {
            $("." + CLASS_CHAT_BOX_WRAPPER).html(html);
        }

        function setUserSearchList(html){
            $("." + CLASS_SEARCH_LIST).html(html);
            $("." + CLASS_SEARCH_LIST).show();
        }

        function setTextMessage(html){
            $("." + CLASS_CHAT_BOX_WRAPPER).html(html);

            var chatContent = $('.' + CLASS_CHAT_BOX_CONTENT);
            chatContent.scrollTop(chatContent[0].scrollHeight);
        }

        function appendTextMessage(html){
            var chatContent = $('.' + CLASS_CHAT_BOX_CONTENT);
            chatContent.append(html);
            chatContent.scrollTop(chatContent[0].scrollHeight);
        }
        function removeTextMessge(message_id){
            $('#' + ID_CHAT_BOX_MESSAGE + message_id).remove();
        }

        function setTextMessageStatus(message_id, html){
            $('#' + ID_CHAT_BOX_MESSAGE + message_id + " ." + CLASS_CHAT_BOX_MESSAGE_STATUS).html(html);
        }


        function setMessageRead(conversation_id){
            $.post('messages_read', {conversation_id: conversation_id}, function () {
                loadConversationData();
            });
        }
        function setMessageReceive(conversation_id){
            $.post('message_receive', {conversation_id: conversation_id}, function () {

            });
        }

        function loadConversationData() {
            $.get('conservations_list', setConversationList, "html");
        }

        function loadChatData(conversation_id){
            $.get(PATH_CONVERSATIONS + conversation_id, function(data){
                setTextMessage(data);
                setMessageRead(conversation_id);

                var textarea = $('.' + CLASS_CHAT_BOX_TEXTAREA);
                textarea.val('');
                textarea.focus();
            }, "html");
        }

        function loadLandingPage() {
            $.get('conversation_landingpage', setConversationLandingPage, "html");
        }

        function loadUserSearchList(search){
            $.get('user_search', {search: search, class: 'chat'}, setUserSearchList, "html");
        }

        function sendMessage(text){
            text = text.replace(/^\s+|\s+$/g, ""); //REMOVE bad things

            if(text == "")
                return;

            $.post(PATH_CONVERSATIONS + currentConversation + PATH_MESSAGES, { message:{body: text}},
                function (data) {
                    var textarea = $('.' + CLASS_CHAT_BOX_TEXTAREA);
                    textarea.val('');
                    textarea.focus();

                    appendTextMessage(data);

                    loadConversationData();
                }).fail(function (error) {
                //TODO super stuff
            });
        }

        function removeMessage (message_id) {
            $.post(PATH_CONVERSATIONS + currentConversation + PATH_MESSAGES + "/" + message_id, {_method:'delete'},
                function (data) {
                    if(data.ok){
                        removeTextMessge(message_id);
                    }
                }).fail(function (error) {
            });
        }

        return {
            //PUBLIC
            openChat : function(conversation_id){
                currentConversation = conversation_id;
                $('.' + CLASS_SEARCH_LIST).hide();
                $('.search-user-chat').val("");
                loadChatData(conversation_id);
            },
            openMessanger: function () {
                var that = this;
                //Prüfung ob überhaupt Chat Box vorhanden oder auf andere Seire
                if($('.' + CLASS_CHAT_BOX_WRAPPER).length >= 1) {
                    //enjoy the loading Animations :D
                    setTimeout(function(){
                        if(currentConversation){
                            that.openChat(currentConversation);
                        }else{
                            if(sessionStorage.getItem('currentConversation')){
                                that.openChat(sessionStorage.getItem('currentConversation'));
                                sessionStorage.removeItem('currentConversation');
                            }else{
                                loadLandingPage();
                            }
                        }
                    }, 300);

                }
            },
            openChatFromOtherPage: function (conversation_id) {
                sessionStorage.setItem('currentConversation', conversation_id);
                window.location.href = "../conversations";
            },
            showOverview: function () {
              currentConversation = null;
              loadLandingPage();
            },
            webSocketNewMessage: function (conversation_id, message_id, from_user, html) {
                //Prüfung ob überhaupt Chat Box vorhanden oder auf andere Seire
                if($('.' + CLASS_CHAT_BOX_WRAPPER).length >= 1){
                    //Prüfung ob auch aktuelle Konversation
                    if(currentConversation == conversation_id){
                        appendTextMessage(html);
                        setMessageRead(conversation_id);
                        setPersonOnline();
                    }else{
                        setMessageReceive(conversation_id);
                        loadConversationData();
                        notifyNewMessage(from_user.first_name);
                    }
                }else{
                    //Prüfen ob auf der Hauptseite das Dashboard aktualisieren
                    if($('.' + CLASS_DASHBOARD_MESSAGE).length >= 1){
                        window.location.href = '..';
                    }else {
                        setMessageReceive(conversation_id);
                        notifyNewMessage(from_user.first_name);
                    }
                }
            },
            webSocketNewMessageStatus: function (conversation_id, messages) {
                //Prüfung ob überhaupt Chat Box vorhanden oder auf andere Seire
                if($('.' + CLASS_CHAT_BOX_WRAPPER).length >= 1) {
                    //Prüfung ob auch aktuelle Konversation
                    if (currentConversation == conversation_id) {
                        for(var i = 0; i < messages.length; i++){
                            setTextMessageStatus(messages[i].message_id, messages[i].html);
                        }

                    }
                }
            },
            webSocketRemoveMessage: function (conversation_id, message_id) {
                //Prüfung ob überhaupt Chat Box vorhanden oder auf andere Seire
                if($('.' + CLASS_CHAT_BOX_WRAPPER).length >= 1) {
                    //Prüfung ob auch aktuelle Konversation
                    if (currentConversation == conversation_id) {
                        removeTextMessge(message_id);
                    }
                }
            },
            webSocketConversation: function (html) {
                //Prüfung ob überhaupt Liste vorhanden oder auf andere Seire
                if($('.' + CLASS_CONVESATIONS_LIST).length >= 1){
                    setConversationList(html);
                }
            },
            checkInputKey:function (event, textarea) {
                if (event.keyCode == 13 && !event.shiftKey && !event.ctrlKey) {
                    event.preventDefault();
                    sendMessage(textarea.val());
                }
            },
            searchUser:function (inputField) {
                if(inputField.val().length < 1){
                    $('.' + CLASS_SEARCH_LIST).hide();
                    return;
                }else{
                    loadUserSearchList(inputField.val());
                }
            },
            clickSubmit:function () {
                sendMessage($('.' + CLASS_CHAT_BOX_TEXTAREA).val())
            },
            deleteMessage:function (message_id) {
                removeMessage(message_id);
            }
        };
    }
    return {
        getInstance: function () {
            if(!instance){
                instance = init();
            }
            return instance;
        },
        destroy: function () {
            instance = null;
        }
    };
})();
