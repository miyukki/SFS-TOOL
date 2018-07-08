var setInitSaveData = function(data) {
    if (!getSaveData()) setSaveData(data);
};
var getSaveData = function() {
    if (localStorage['data'] == undefined) return false;
    return JSON.parse(localStorage['data']);
};
var setSaveData = function(data) {
    localStorage['data'] = JSON.stringify(data);
};
setInitSaveData({
    css: true
});
/** CSS適用 **/
if (getSaveData()['css'] && location.pathname != "/sfc-sfs/index.cgi") {
    $("head").append($("<link/>").attr({
        rel: "stylesheet",
        type: "text/css",
        href: chrome.extension.getURL("sfs.css")
    }));
}
$(function() {
    /** Lesson **/
    var Lesson = function(url, dirtyhtml) {
        var dom = $("<div/>").addClass("tmp" + Math.random()).css({
            display: "none",
            visiblity: "hidden"
        });
        $("body").append(dom.find("body"));
        dom.html(dirtyhtml);

        this.url = url;
        this.dom = dom;
    }
    Lesson.prototype.getUrl = function() {
        return this.url;
    }
    Lesson.prototype.getTitle = function() {
        var header = this.dom.find("h3");
        header.find(".en").remove();
        return header.text().split("\n")[1];
    }
    Lesson.prototype.getTeacher = function() {
        var header = this.dom.find("h3");
        header.find(".en").remove();
        return header.text().split("\n")[2].substr(3);
    }
    Lesson.prototype.getRoom = function() {
        var header = this.dom.find("h3");
        header.find(".en").remove();
        var room = header.text().split("\n")[4];
        room = room.slice(room.indexOf("（") + 1, room.indexOf("）"))
        return room;
    }
    Lesson.prototype.getHomework = function() {
        var ret = this.dom.find("font[color=#cc0000]:contains(課題)").parent().parent().find("p");
        ret.find("a").removeAttr("href");
        ret.find("a").attr("href", this.getUrl());
        ret.find(".en").remove();
        return ret;
    }
    Lesson.prototype.getPlanDeleteUrl = function() {
        var param_id = this.getUrl().match("id=[a-z0-9]+")[0];
        var param_yc = this.getUrl().match("yc=[0-9]{4}_[0-9]+")[0];
        return "https://vu.sfc.keio.ac.jp/sfc-sfs/sfs_class/student/plan_list.cgi?" + UT_getLang() + "&" + param_id + "&" + param_yc + "&mode=del";
    }
    Lesson.prototype.getSummaryUrl = function() {
        var param_id = this.getUrl().match("id=[a-z0-9]+")[0];
        var param_yc = this.getUrl().match("yc=[0-9]{4}_[0-9]+")[0];
        return "http://vu.sfc.keio.ac.jp/course2007/summary/class_summary_by_kamoku.cgi?" + UT_getLang() + "&" + param_id + "&" + param_yc;
    }
    Lesson.prototype.getTimes = function(data) {
        // 0 1 2 3 4 5(その他) 曜日
        // 0 1 2 3 4 5 6 時限
        var ret = new Array();
        day_matches = this.dom.find("h3").text().split("\n")[4].match(/.曜日.時限/g);
        for (var i = 0; i < day_matches.length; i++) {
            ret.push("" + UT_getDay(day_matches[i].substr(0, 1)) + UT_getPeriod(day_matches[i].substr(3, 1)));
        }
        if (day_matches.length == 0) {
            ret.push("" + 6);
        }
        return ret;
    }
    var UT_getLang = function() {
        var langs = location.search.match("lang=([a-z]+)");
        if (langs == null) {
            return "lang=ja";
        }
        return "lang=" + langs[1];
    }
    var UT_getDay = function(exp) {
        if (exp == "月") return 0;
        if (exp == "火") return 1;
        if (exp == "水") return 2;
        if (exp == "木") return 3;
        if (exp == "金") return 4;
        return 5;
    }
    var UT_getPeriod = function(exp) {
        if (exp == "１") return 0;
        if (exp == "２") return 1;
        if (exp == "３") return 2;
        if (exp == "４") return 3;
        if (exp == "５") return 4;
        if (exp == "６") return 5;
        if (exp == "７") return 6;
        return null;
    }
    var FC_EasyTimetable = function() {
        var param_id = location.search.match("id=[a-z0-9]+")[0];
        var param_term = $("[target=frame]").attr("href").match("term=[0-9]{4}.")[0];
        var content = "https://vu.sfc.keio.ac.jp/sfc-sfs/sfs_class/student/plan_timetable.cgi?" + UT_getLang() + "&" + param_term + "&" + param_id;
        $(".noticeTitle").after($('<iframe width="100%" frameborder="0" height="800" scrolling="auto" marginwidth="0" marginheight="0" align="middle"/>').attr("src", content));
        console.log(content);
    }
    var FC_Homework = function() {
        var noticeBox = $("<div/>").hide();
        $(".noticeTitle").after(noticeBox);
        var status = $("<p/>").text("読み込み中...")
        $(".noticeTitle").after(status);

        // パラメータ
        var param_id = location.search.match("id=[a-z0-9]+")[0];
        var param_term = $("[name=frame]").attr("src").match("term=[0-9]{4}.")[0];
        $.get("https://vu.sfc.keio.ac.jp/sfc-sfs/sfs_class/student/view_timetable.cgi?" + param_id + "&" + param_term + "&fix=0&" + UT_getLang(), function(data) {
            // var classes = $("[name=frame]").contents().find("td a");
            var dom = $("<div/>").addClass("tmp" + Math.random()).css({
                display: "none",
                visiblity: "hidden"
            });
            $("body").append(dom);
            dom.html(data);
            var classes = dom.find("td a");

            var class_urls = new Array();
            for (var i = 0; i < classes.length; i++) {
                class_urls.push($(classes[i]).attr("href"));
            }
            class_urls = $.unique(class_urls);

            var remain = class_urls.length;
            for (var j = 0; j < class_urls.length; j++) {
                $.ajax({
                    type: "GET",
                    url: class_urls[j],
                    success: (function(url) {
                        return function(data) {
                            lesson = new Lesson(url, data);
                            var hw = lesson.getHomework();
                            var unsubmitted_hw = Array.from(hw).filter(function(h) {
                                return $(h).text().indexOf("未提出") != -1;
                            });
                            if (unsubmitted_hw && unsubmitted_hw.length > 0) {
                                noticeBox.append($("<p/>").addClass("ST_title").text(lesson.getTitle()));
                                for (var i = 0; i < unsubmitted_hw.length; i++) {
                                    noticeBox.append($(unsubmitted_hw[i]).addClass("ST_data"));
                                }
                            }
                            // hw = hw[hw.length-1];
                            // if(hw) noticeBox.append($("<p/>").addClass("ST_title").text(lesson.getTitle())).append($(hw).addClass("ST_data"));
                            status.text("読み込み中...残り" + --remain);
                            if (remain == 0) {
                                $("[src*='square_red.gif']").css({
                                    cursor: "pointer"
                                }).click(function() {
                                    console.log($(this).parent().remove());
                                });
                                noticeBox.show();
                                status.remove();
                            }
                        }
                    })(class_urls[j])
                });
            }
        });
    };
    var FC_Timetable = function() {
        var days = new Array();
        for (var i = 0; i < 6; i++) {
            var periods = new Array();
            for (var j = 0; j < 7; j++) {
                periods.push(new Array());
            };
            days.push(periods);
        };

        var noticeBox = $("<div/>");
        $(".noticeTitle").after(noticeBox);
        var status = $("<p/>").text("読み込み中...")
        noticeBox.append(status);
        var classes = $("[name=frame]").contents().find("td a");
        var class_urls = new Array();
        for (var i = 0; i < classes.length; i++) {
            if ($(classes[i]).attr("href").indexOf("s_class_top.cgi") == -1) continue;
            class_urls.push($(classes[i]).attr("href"));
        }
        class_urls = $.unique(class_urls);

        var remain = class_urls.length;
        for (var j = 0; j < class_urls.length; j++) {
            $.ajax({
                type: "GET",
                url: class_urls[j],
                success: (function(url) {
                    return function(data) {
                        lesson = new Lesson(url, data);
                        var times = lesson.getTimes();
                        for (var k = 0; k < times.length; k++) {
                            days[times[k].substr(0, 1)][times[k].substr(1, 1)].push(lesson);
                        }
                        status.text("読み込み中...残り" + --remain);
                        if (remain == 0) {
                            var output = "";
                            output += '<table width="100%">';
                            output += '<tr bgcolor="#cbd7e4"><th></th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th nowrap>その他</th></tr>';
                            for (var l = 0; l < 7; l++) {
                                output += '<tr valign="top" bgcolor="#eeeeee"><th bgcolor="#cbd7e4">' + (l + 1) + '</th>';
                                for (var m = 0; m < 6; m++) {
                                    output += '<td bgcolor="#eeeeee">'
                                    for (var n = 0; n < days[m][l].length; n++) {
                                        $.data(document.body, ("" + m + l + n), lesson);
                                        output += '<span class="ST_plan_delete" data-mln="' + ("" + m + l + n) + '"">×</span><a href="' + days[m][l][n].getUrl() + '" target="_blank">' + days[m][l][n].getTitle() + '[' + days[m][l][n].getRoom() + ']</a>&nbsp;<span class="ST_plan_summary" data-mln="' + ("" + m + l + n) + '"">詳細</span><br>( ' + days[m][l][n].getTeacher() + ' )<br>'
                                    };
                                    output += '</td>';
                                };
                                output += '</tr>';
                            };
                            output += '</table>';

                            $(".noticeTitle").after(output);
                            $(".ST_plan_summary").click(function() {
                                var mln = "" + $(this).data('mln');
                                var lesson = days[mln[0]][mln[1]][mln[2]];
                                window.open(lesson.getSummaryUrl());
                            });
                            $(".ST_plan_delete").click(function() {
                                var mln = "" + $(this).data('mln');
                                var lesson = days[mln[0]][mln[1]][mln[2]];
                                if (confirm(lesson.getTitle() + "を削除します")) {
                                    $.get(lesson.getPlanDeleteUrl(), function() {
                                        location.reload();
                                    });
                                }
                            });
                            status.remove();
                        };
                    }
                })(class_urls[j])
            });
        }
    };



    /** セッション終了時移動 **/
    if ($("h3:contains(本セッションは終了しました)").size() > 0 || $("h3:contains(セッションがタイムアウトしました)").size() > 0) {
        location.href = $("a:contains(SFC-SFS トップページ)").attr("href");
    }

    if ($("input[type=text]").val() != "" && $("input[type=password]").val()) {
        $("input[type=submit]").click();
    }

    /** 掲示板機能 **/
    if (location.pathname == "/sfc-sfs/sfs_class/student/s_class_top.cgi") {
        var yc = location.href.match("yc=[2014]{4}_[0-9]+")[0];
        var bbsContent = $('<tr><td valign="top" align="right" bgcolor="#cbd7e4"><font color="#000000"><b>匿名掲示板<br>βテスト</b></font><span class="en"><br>Notice</span></td><td bgcolor="#cbd7e4" width="100%"><div class="bbs_area"></div><br></td></tr>');
        var hrBar = $('<tr> <th align="right"><hr noshade=""></th><td><hr noshade=""></td></tr>');
        $("b:contains(お知らせ)").parent().parent().parent().before(bbsContent);
        $("b:contains(お知らせ)").parent().parent().parent().before(hrBar);

        var createMessage = function(date, name, body) {
            var week = new Array("日", "月", "火", "水", "木", "金", "土");
            $("<div/>").append(
                $("<span>").addClass("bbsDate").text(date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日(" + week[date.getDay()] + ") " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + "." + date.getSeconds())
            ).append(
                $("<span>").addClass("bbsName").text(name)
            ).append(
                $("<p>").addClass("bbsBody").text(body)
            ).prependTo(contentArea);
        };
        // 出力
        var contentArea = $("<div/>").addClass("bbsContent");
        // 入力
        var inputArea = $("<div/>").append(
            $("<input/>").addClass("bbsInputName").attr("type", "text").attr("placeholder", "名前(空欄も可)")
        ).append(
            $("<input/>").addClass("bbsInputBody").attr("type", "text").attr("placeholder", "メッセージ").attr("size", "70")
        ).append(
            $("<button/>").text("送信").click(function() {
                if ($(".bbsInputBody").val() == "") {
                    alert("メッセージが空です！");
                    return;
                }
                var sid = location.href.match("id=[a-f0-9]+")[0];
                sid = sid.substring(0, 20); // 嵐対策で個人識別に利用するわけではないので適当でよい
                $.post("http://d.applest.net/wellness/posts.php?" + yc + "&" + sid, {
                    name: $(".bbsInputName").val(),
                    body: $(".bbsInputBody").val()
                }, function(data) {
                    createMessage(new Date(), $(".bbsInputName").val(), $(".bbsInputBody").val());
                    $(".bbsInputName").val("");
                    $(".bbsInputBody").val("");
                });
            })
        );
        $(".bbs_area").append(inputArea);
        $(".bbs_area").append(contentArea);
        $(".bbs_area").append($("<p>").text("匿名掲示板はSFS-TOOLが提供する、完全匿名の授業連携型掲示板です。学事などとは一切の関係がありません。").css("color", "#aaa"));

        $.get("http://d.applest.net/wellness/posts.php?" + yc, function(data) {
            data = JSON.parse(data);
            for (var i = 0; i < data.posts.length; i++) {
                var post = data.posts[i];
                var date = new Date();
                date.setTime(post.created_at * 1000);
                createMessage(date, post.name, post.body);
            };

        });
    }

    /** 課題一覧機能 **/
    if (location.pathname == "/sfc-sfs/portal_s/s01.cgi" && location.search.indexOf("mode=1") != -1) {
        var noticeTitle = $("<h4/>").addClass("one").text("課題一覧").addClass("noticeTitle");
        $("h4.one").before(noticeTitle);
        noticeTitle.append($("<button/>").text("未提出の課題一覧を取得").click(function() {
            $(this).remove();
            FC_Homework();
        }));
        // FC_Homework();
    }

    /** 次学期用時間割 **/
    if (location.pathname == "/sfc-sfs/portal_s/s01.cgi" && location.search.indexOf("mode=6") != -1) {
        var noticeTitle = $("<h4/>").addClass("one").text("時間割").addClass("noticeTitle");
        $("h4.one").before(noticeTitle);
        FC_Timetable();
    }

    if (location.pathname == "/sfc-sfs/portal_s/s02.cgi" && location.search.indexOf("mode=2") != -1) {
        var noticeTitle = $("<h4/>").addClass("one").text("時間割").addClass("noticeTitle");
        $("h3").after(noticeTitle);
        FC_EasyTimetable();
    }

    $("body").append(
        $("<div/>").addClass("FT_customcss").text(getSaveData()['css'] ? "CSSをオフにする" : "CSSをオンにする").click(function() {
            var sd = getSaveData();
            sd['css'] = !sd['css'];
            setSaveData(sd);
            location.reload();
        })
    )
});