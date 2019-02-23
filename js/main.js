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
                    botui.message.add({
                        content: decoded
                    });
                    inputForm();
                    break;
            }
            break;
        case "signal":
            switch(data.value[1].value) {
                case "channel_created":
                    inputForm();
                    break;
            }
      }
};

function onClose() {
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
    new Vue({
        el: '.g-recaptcha',
        data: {
            available: false
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
