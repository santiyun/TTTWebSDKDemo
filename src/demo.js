const TTTRtcWeb = require('tttwebsdk');

let RTCObj = new TTTRtcWeb();
let client = null, localStream = null;
let remote_stream = new Map();

function joinChan() {
    client = RTCObj.createClient({role: '2'});
    localStream = null;
    const appid = $("#appID").val();

    let chanid = document.getElementById("chanid").value;
    let userid = document.getElementById('userid').value;

    client.init(appid, userid, function () {
        client.join(chanid, function () {
            local_stream = RTCObj.createStream({
                streamID: userid,
                audio: true,
                video: true,
                screen: false
            });

            local_stream.init(function () {
                $('div#video').append('<div id="div_3t_local"><video autoplay muted id="3t_local" style="height: 300px; width: 300px; background: black; position:relative; display:inline-block;"></video><div id="local_info"></div></div>');
                local_stream.play('3t_local');
                client.publish(local_stream, function success() {
                }, function failure() {
                });
            },
                function () {
                });
        }, function (err) {
        });
    }, function (err) {
    });

    client.on('peer-join', (evt) => {
        console.log('user joined room. uid=', evt.name);
    });

    client.on('peer-leave', (evt) => {
        console.log('user leaved room. uid=', evt.name);
    });

    client.on('stream-added', (evt) => {
        console.log('stream-addedd id=', evt.stream.getId());
        var stream = evt.stream;
        remote_stream.set(stream.getId(), stream);
        let in_stream = remote_stream.get(stream.getId());
        client.subscribe(in_stream, function (event) {
            //successful doing someting, like play remote video or audio.
        },
            function () {
                // info.val(info.val() + 'Subscribe stream successful\n');
            },
            function (err) {
                // info.val(info.val() + "Subscribe stream failed" + err + '\n');
            });
    });

    client.on('stream-removed', function (evt) {
        var peer = evt;
        $('#3t_remote' + peer.name).remove();

        // remove stream from map
        remote_stream.delete(peer.name);
    });

    client.on('peer-leave', function (evt) {
        console.log('peer-leave, id=', evt.stream.getId());
        var stream = evt.stream;
        stream.stop();
        stream.close();
        $('#3t_remote' + stream.getId()).remove();

        // remove stream from map
        remote_stream.delete(stream.getId());
    });

    client.on('stream-subscribed', function (evt) {
        var stream = evt.stream;
        // info.val(info.val() + "Subscribe remote stream successfully: " + stream.getId() + "\n");
        var videoId = "3t_remote" + stream.getId();
        if ($('div#video #' + videoId).length === 0) {
            $('div#video').append('<video autoplay id="' + videoId + '" style="height: 300px; width: 300px; background: black; position:relative; display:inline-block;"></video>');
        }

        stream.play('3t_remote' + stream.getId());
    });

    client.on('video-mute', () => {
        var peer = evt;
        console.log('video-mute', peer.name);
        $('#3t_remote' + peer.name).remove();

        // remove stream from map
        remote_stream.delete(peer.name);
    })
}

function leaveChan() {
    if (client) {
        client.leave();
        client.close();
    }
}

$('#joinChan').bind('click', () => {
    return joinChan();
});

$('#leaveChan').bind('click', () => {
    return leaveChan();
});