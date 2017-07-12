$(function() {
    entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;',
        "(": '&#x28;',
        ")": '&#x29;',
        "#": '&#x23',
        "$": '&#x24;',
    };
    status = false;

    function escapeHtml(string) {
        return String(string).replace(/[&<>"'\/]/g, function(s) {
            return entityMap[s];
        });
    }
    var socket = io.connect();
    var $messsageForm = $('#messageForm');
    var $message = $('#message');
    var $chat = $('#chat');
    var $userFormArea = $('#userFormArea');
    var $messageArea = $('#messageArea');
    var $userForm = $('#userForm');
    var $users = $('#users');
    var $username = $('#username');
    $messsageForm.submit(function(e) {
        e.preventDefault();
        if ($message.val() != "undefined" && $message.val() != "") {
            socket.emit('send message', $message.val());
            $message.val('');
        } else {
            $('.errorMsg').html('Please Enter the Message');
        }
    })
    socket.on('new message', function(data) {
        $chat.append('<div class="well well-align" disabled="true"><strong>' + escapeHtml(data.user) + '</strong>: ' + escapeHtml(data.msg) + '</div>').html();
        $('.well-align').emoticonize();
        var div = document.getElementById('chat');
        div.scrollTop = div.scrollHeight - div.clientHeight;
        setTimeout(function() {
            $('.css-emoticon').removeClass('animated-emoticon');
        }, 1000);
    });
    $userForm.submit(function(e) {
        e.preventDefault();
        if ($username.val() != "undefined" && $username.val() != "") {
            globalVal = $username.val();
            socket.emit('new user', $username.val(), function(data) {
                if (data) {
                    $userFormArea.hide();
                    $messageArea.show(function() {
                        $('#message').emojiPicker();
                    });

                }
            });
            $username.val('');
            status = true;

        } else {
            $('.errorMsg').html('Please Enter the User Name');
        }
    });
    socket.on('user disconnected', function(data) {
        data ? $chat.prepend("<div class='well status'>" + escapeHtml(data) + " is disconnected from the App</div>") : '';
    });
    socket.on('get users', function(data) {
        var html = '';
        $('.status').hide();
        if (status) {
            className = 'green';
        }
        for (i = 0; i < data.length; i++) {
            html += '<li class="list-group-item"><div>' + escapeHtml(data[i]) + '<span class=' + className + '></span></div></li>';
        }
        $users.html(html);
    });
    socket.on('file upload', function(data) {
        console.log(data);
        $('#fileMsg').html(data + " uploaded successfully");
    });
    var timeout;

    function timeoutFunction() {
        typing = false;
        socket.emit("typing", false);
    }
    $('#messageFormSubmit').click(function() {
        $('#messageForm').submit();
    });
    $('#message').on('keyup', function(event) {
        if ((!event.shiftKey && event.which == 13) && $.trim($('#message').val()) != "") {
            $('#messageForm').submit();
        } else {
            typing = true;
            socket.emit('typing', escapeHtml(globalVal));
            clearTimeout(timeout);
            timeout = setTimeout(timeoutFunction, 500);
        }
    });
    socket.on('typing', function(data) {
        if (data) {
            $('.typing').html(data + " is typing..");
        } else {
            $('.typing').html("");
        }
    });
    $('.fileAttach').on('click', function(e) {
        e.preventDefault();
        $('#sampleFile').click();
        var handle = setInterval(check, 20);

        function check() {
            var selected = document.getElementById("sampleFile").files.length > 0;
            if (selected) {
                $('#uploadForm').submit();
                clearInterval(handle);

            }
        }
    });
});
$(document).ready(function() {
    $(this).on("contextmenu", function() {
        return false;
    });
});