function setUpBert() {
    bert = new BertClass();
    bert.encodeObjectKeysAsNumber = true;
    bert.encodeStringAsBinary = true;
};

function setUpWS() {
    websocket = new WebSocket("ws://127.0.0.1:8080/ws");
    websocket.binaryType = "arraybuffer";
    websocket.onmessage = onMessage;
    websocket.onclose = onClose;
};

function inputForm() {
    botui.action.text({
        action: {
        }
    }).then(function (res) {
        send(bert.tuple(bert.atom("msg"), bert.tuple(bert.atom("text"), res.value)));
        inputForm()
    });
};

function send(Obj) {
    var encoded = bert.encode(Obj);
    var byteArray = bert.binary_to_list(encoded);
    websocket.send(new Uint8Array(byteArray));
}

function onMessage(msg) {
    var array = new Uint8Array(msg.data);
    var charData = bert.bytes_to_string(array);
    var data = bert.decode(charData);

    switch(data.value[0]) {
        case "msg":
            switch(data.value[1][0]) {
                case "text":
                    botui.message.add({
                        content: data.value[1][1].value
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

var botui = new BotUI('chat-app');

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

    setUpBert();
    setUpWS();

    botui.message.add({
      content: 'Trying to find someone...'
    });

});