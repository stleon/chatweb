var is_typing = false;
const typing_delay = 5000;
var timerId;
var typing_message_index;

function setUpBert() {
    bert = new BertClass();
    bert.encodeObjectKeysAsNumber = true;
    bert.encodeStringAsBinary = false;
};

function setUpWS(url) {
    websocket = new WebSocket(url);
    websocket.binaryType = "arraybuffer";
    websocket.onopen = onOpen;
    websocket.onmessage = onMessage;
    websocket.onclose = onClose;
};

function inputForm() {
    botui.action.text({
        action: {
        }
    }).then(function (res) {
        encoded = new TextEncoder("utf-8").encode(res.value);
        send(bert.tuple(bert.atom("msg"), bert.tuple(bert.atom("text"), encoded)));
        inputForm()
    });
};

function send(Obj) {
    var encoded = bert.encode(Obj);
    var byteArray = bert.binary_to_list(encoded);
    var data = new Uint8Array(byteArray);
    websocket.send(data);
}

function send_typing(is_typing) {
    encoded = new TextEncoder("utf-8").encode("typing");
    send(bert.tuple(bert.atom("signal"), 1, is_typing));
}

function delete_typing_message() {
    if (typing_message_index != undefined) {
        botui.message.remove(typing_message_index, {});
    }
}

function onOpen(){
    setUpBert();
}

function onMessage(msg) {
    var array = new Uint8Array(msg.data);
    var charData = bert.bytes_to_string(array);
    var data = bert.decode(charData);

    switch(data.value[0]) {
        case "msg":
            switch(data.value[1][0]) {
                case "text":
                    array = new Uint8Array(data.value[1][1]);
                    decoded = new TextDecoder("utf-8").decode(array);
                    delete_typing_message();
                    botui.message.add({
                        content: decoded
                    });
                    inputForm();
                    break;
            }
            break;
        case "signal":
            switch(data.value[1]) {
                case 0:  // channel_created
                    inputForm();
                    break;
                case 1:  // typing
                    if (data.value[2] == true) {
                        botui.message.add({
                            loading: true
                        }).then(function (index) {
                            typing_message_index = index;
                        });
                    } else {
                        delete_typing_message();
                    }
                    break;
            }
      }
};

function onClose() {
    delete_typing_message();
    botui.message.add({
        content: 'Chat have been canceled'
    });

    botui.action.button({
        action: [
          {
            text: 'Start New',
            value: true
          }
        ]
    }).then(function (res) {
        location.reload();
    });
};

function main(token) {
    var recaptcha  = new Vue({
        el: '.g-recaptcha',
        data: {
            seen: false
        }
    });

    botui = new BotUI('chat-app');

    botui.message.add({
        content: 'Hello, wanna chat with someone?'
    });

    botui.action.button({
        action: [
            {
            text: 'Yes',
            value: true
            }
        ]
    }).then(function (res) {

        var host = window.location.hostname;
        var port = window.location.port;

        var url = "ws://" + host + ':' + port + "/ws"
        if (token.length != 0) {
            url = url + "?token=" + token;
        }

        setUpWS(url);
        botui.message.add({
            content: 'Trying to find someone...'
        });

    });
};

function typing(event) {

    if (event.key == "Enter") {
        is_typing = false;
        clearTimeout(timerId);
    } else {
        if (is_typing == false) {
            is_typing = true;
            send_typing(is_typing);

        } else {
            if (timerId != undefined) {
                clearTimeout(timerId);
            }
        };

        timerId = setTimeout(function(){
            is_typing = false;
            send_typing(is_typing);
        }, typing_delay);
    }
}