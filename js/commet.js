var bridgeArray, cometfunc;
bridgeArray = [];
cometfunc = function(data) {
  var i, newData, randkod, splitData, _ref;
  randkod = data.split("\n")[0].split("-->")[2];
  splitData = data.split("\n")[0].split("-->");
  newData = splitData[0] + "-->" + splitData[1];
  if (data.split("\n").length > 2) {
    for (i = 1, _ref = data.split("\n").length; 1 <= _ref ? i < _ref : i > _ref; 1 <= _ref ? i++ : i--) {
      newData = newData + "\n" + data.split("\n")[i];
    }
  }
  bridgeArray[randkod].onmessage(newData);
  return $.ajax({
    url: '/cometConfirm',
    type: 'POST',
    data: {
      data: newData,
      kod: randkod
    },
    success: function(data, status, response) {},
    error: function() {}
  });
};
