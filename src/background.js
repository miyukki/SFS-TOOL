var setInitSaveData = function(data) {
  if(!getSaveData()) setSaveData(data);
};
var getSaveData = function() {
  if(localStorage['data']==undefined) return false;
  return JSON.parse(localStorage['data']);
};
var setSaveData = function(data) {
  localStorage['data'] = JSON.stringify(data);
};
setInitSaveData({"wellness_notify": []});
var data = getSaveData();

var batch_function = function() {
  console.log("func");
  $.get("https://wellness.sfc.keio.ac.jp/v3/", function(data) {
    data = $(data);
    if(data.find("h2:contains(予約空き授業)").size() > 0) {
      $.post("http://d.applest.net/wellness/fuck.php", {version: chrome.runtime.getManifest().version, route: "background - all", data: data.find("table.cool").html()}, function(data) {
        console.log(data);
      })
    }
  })
}
var load_function = function() {
  $.getJSON("http://d.applest.net/wellness/getjson.php", {lectures: data.wellness_notify.join(",")}, function(data) {
    // console.log(data);
    $.each(data, function() {
      if(this.count == 0) return true; // continue
      var notify = webkitNotifications.createNotification(
        chrome.runtime.getURL("/wellness.png"), "体育システム - " + this.name, this.date + this.period +"限 " + this.name + "の授業が空いています(" + this.count + "人)"
      );
      notify.onclick = function() {
        window.open("https://wellness.sfc.keio.ac.jp/v3/");
        notify.cancel();
      };
      setTimeout(function(){
        notify.show()
        setTimeout(function(){
          notify.cancel()
        }, 6000);
      }, 6000);
    })
  })
}
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name == "batch") {
    batch_function(); 
  }
  if (alarm.name == "load") {
    load_function(); 
  }
  console.log(alarm.name);
});
chrome.alarms.create("batch", { periodInMinutes: 30 + Math.random()*10 });
chrome.alarms.create("load", { periodInMinutes: 1 });

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if(message.name == "wlns_check") {
    sendResponse({check: (data.wellness_notify.indexOf(message.lid) != -1)});
  }
  if(message.name == "wlns_notify") {
    var index = data.wellness_notify.indexOf(message.lid);
    if(index != -1) {
      data.wellness_notify.splice(index, 1);
    }else{
      data.wellness_notify.push(message.lid);
    }
    setSaveData(data);
  }
  // console.log(message, sender);
});
