"use strict";
var INPUT_NO_INPUT = -1;
var INPUT_REMOTE_URL = 0;
var INPUT_LOCAL_FILE = 1;

var default_url = "Enter URL to your KDBX file here...";

var inputs = new Array(2);
var current_input = INPUT_NO_INPUT;

var keyfile = null;

var clear_password = function () {
  $("#password").val("");
  $("#keyfile").css("background-color", "transparent");
  keyfile = null;
};

function select_input(input_type) {
  current_input = INPUT_NO_INPUT;
  var blocks = {
    url_option: "transparent",
    file_option: "transparent"
  };
  switch (input_type) {
    case INPUT_REMOTE_URL:
      var v = $("#url").val();
      if (v.length > 0 && v != default_url) {
        blocks["url_option"] = "green";
        current_input = input_type;
      }
      break;
    case INPUT_LOCAL_FILE:
      if (inputs[input_type] != null) {
        blocks["file_option"] = "green";
        current_input = input_type;
      }
      break;
  }
  for (var block in blocks) {
    $("#" + block).css("background-color", blocks[block]);
  }
}

function show_entries(entries) {
  $("#entries").empty();
  for (var i in entries) {
    var entry = entries[i];
    var captionText = entry["Title"] + " -- " + entry["URL"];
    captionText = document.createTextNode(captionText);
    var caption = document.createElement("div");
    caption.appendChild(captionText);
    $("#entries").append(caption);

    var table = document.createElement("table");
    $(table).css("width", "100%");
    $("#entries").append(table);
    $(table).append("<thead><tr><th>Key</th><th>Value</th></tr></thead>");

    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    for (var key in entry) {
      var row = document.createElement("tr");
      tbody.appendChild(row);
      var value = entry[key];
      var keyCell = document.createElement("td");
      keyCell.appendChild(document.createTextNode(key));
      var valueCell = document.createElement("td");
      valueCell.appendChild(document.createTextNode(value));

      row.appendChild(keyCell);
      row.appendChild(valueCell);
    }
  }
  $("#entries").accordion({
                            collapsible: true,
                            animate: false,
                            active: false,
                            heightStyle: "content"
                          });
}

function load_keepass() {
  var data = inputs[current_input];
  data = new jDataView(data, 0, data.length, true)
  var pass = $("#password").val();
  var passes = new Array();
  if (pass.length > 0) {
    pass = readPassword(pass);
    passes.push(pass);
  }
  if (keyfile != null) {
    passes.push(keyfile);
  }
  try {
    var entries = readKeePassFile(data, passes);
    clear_password();
    show_entries(entries);
    var options = {
      label: "Unload",
      icons: {
        primary: "ui-icon-locked"
      }
    };
    $("#load_unload").button(options);
  }
  catch (e) {
    alert("Cannot open KeePass Database: " + e);
  }
  $("#load_unload").removeAttr("disabled");
}

function load_url(url) {
  /* jQuery does not support arraybuffer yet. so have to do XHR */
  var oReq = new XMLHttpRequest();
  oReq.open("GET", url, true);
  oReq.responseType = "arraybuffer";
  oReq.onload = function (oEvent) {
    var arrayBuffer = oReq.response; // Note: not oReq.responseText
    if (arrayBuffer) {
      inputs[INPUT_REMOTE_URL] = arrayBuffer;
      load_keepass();
    }
  };
  oReq.onerror = function (e) {
    alert("Cannot load URL " + url);
    $("#load_unload").removeAttr("disabled");
  };
  oReq.send(null);
}

window.onload = function () {
  var dropzone = document.getElementById("file_option");

  dropzone.ondragover = dropzone.ondragenter = function (event) {
    event.stopPropagation();
    event.preventDefault();
  };

  dropzone.ondrop = function (event) {
    event.stopPropagation();
    event.preventDefault();

    var filesArray = event.dataTransfer.files;
    if (filesArray.length > 0) {
      var file = filesArray[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        inputs[INPUT_LOCAL_FILE] = e.target.result;
        select_input(INPUT_LOCAL_FILE);
      };
      reader.onerror = function (e) {
        alert("Cannot load local file " + file.name);
      };
      reader.readAsArrayBuffer(file);
    }

    select_input(INPUT_LOCAL_FILE);
  };

  dropzone = document.getElementById("keyfile");

  dropzone.ondragover = dropzone.ondragenter = function (event) {
    event.stopPropagation();
    event.preventDefault();
  };

  dropzone.ondrop = function (event) {
    event.stopPropagation();
    event.preventDefault();

    var filesArray = event.dataTransfer.files;
    if (filesArray.length > 0) {
      var file = filesArray[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        var dataview = new jDataView(e.target.result, 0,
                                     e.target.result.length, true);
        keyfile = readKeyFile(dataview);
        $("#keyfile").css("background-color", "green");
      };
      reader.onerror = function (e) {
        alert("Cannot load key file " + file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  $("#load_unload").button({
                             label: "Load",
                             icons: {
                               primary: "ui-icon-unlocked"
                             }
                           }).click(function () {
                                      if ($(this).text() == "Load") {
                                        $(this).attr("disabled", true);
                                        if (current_input == INPUT_REMOTE_URL) {
                                          var url = $("#url").val();
                                          load_url(url);
                                        }
                                        else if (current_input == INPUT_LOCAL_FILE) {
                                          load_keepass();
                                        }
                                      }
                                      else {
                                        clear_password();
                                        $("#entries").empty();
                                        $("#entries").accordion("destroy");
                                        var options = {
                                          label: "Load",
                                          icons: {
                                            primary: "ui-icon-unlocked"
                                          }
                                        };
                                        $(this).button(options);
                                      }
                                    });

  $("#url").val(default_url);
  $("#url").keyup(function (e) {
    if (e.keyCode == 13) {
      select_input(INPUT_REMOTE_URL);
    }
  }).click(function () {
             if ($(this).val() == default_url) {
               $(this).val("");
             }
             select_input(INPUT_REMOTE_URL);
           }).blur(function () {
                     select_input(INPUT_REMOTE_URL);
                     if ($(this).val().length == 0) {
                       $(this).val(default_url);
                     }
                   });

  $("#url_option").click(function () {
    select_input(INPUT_REMOTE_URL);
  });
  $("#file_option").click(function () {
    select_input(INPUT_LOCAL_FILE);
  });

  $("#password").keyup(function (e) {
    if (e.keyCode == 13) {
      $("#load_unload").click();
    }
  });
};
