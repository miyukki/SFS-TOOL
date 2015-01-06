function getLID(str) {
	if(str == undefined) return false;
	return str.match(/lecture=([0-9]+)/)[1];
}
$(function() {
	/** 予約空き授業の通知 **/
	if(location.pathname.indexOf("pc.php") != -1 && $("h2:contains(予約空き授業)").size() > 0) {
		$.post("http://d.applest.net/wellness/fuck.php", {version: chrome.runtime.getManifest().version, route: "content - all", data: $("table.cool").html()}, function(data) {
			console.log(data);
		})
	}

	if(location.pathname.indexOf("pc.php") != -1 && $("h2:contains(おしらせ)").size() > 0) {
		$("h2:contains(おしらせ) + ul").after($("<h2>おしらせ(SFS-TOOL)</h2><ul><li>SFS-TOOLが体育システムの通知に対応しました！</li><li>曜日ごとのページから通知をチェックすると空きが出た時点で通知をします。</li><li>テスト段階なので不具合とかあれTwitterで教えてください(@toriimiyukki)。</li></ul>"))
	}

	if(location.pathname.indexOf("pc.php") != -1 && $("h2:contains(予約)").size() > 0 && $("h3:contains(月)").size() > 0) {
		$.post("http://d.applest.net/wellness/fuck2.php", {version: chrome.runtime.getManifest().version, route: "content - day", date: $("h3:contains(月)").text(), data: $("table.cool").html()}, function(data) {
			console.log(data);
		})
		$("table.cool tr th:last-child").after($("<th class=\"center\">空き通知</th>"));
		$("table.cool tr td:last-child").each(function() {
			var lid = getLID($(this).parent().find("a").attr("href"));
			if(!lid) {
				$(this).after($("<td class=\"center\"></td>"));
				return true;
			}
			var notify_td = $("<td class=\"center\"><input class=\"st_wlns_notify\" type=\"checkbox\"></td>").data("lid", lid);
			chrome.runtime.sendMessage({name: "wlns_check", lid: lid}, function(response) {
				notify_td.find("input").attr("checked", response.check);
			});
			$(this).after(notify_td);
		})
		$(".st_wlns_notify").click(function() {
			var lid = $(this).parent().data("lid");
			chrome.runtime.sendMessage({name: "wlns_notify", lid: lid, notify: $(this).prop('checked')});
		});
	}
});