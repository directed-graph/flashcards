
function loadData(csvData, keyColumns) {
  // Maps keys to each row.
  var data = {}

  // Array of all keys. Each element is an array of the key for a single row.
  var keys = [];

  var keyColumnsSet = new Set(keyColumns.split(','));

  // Very naive parser. This does not handle commas in values or CSV with
  // non-uniform row lengths.
  for (row of csvData.split('\n')) {
    var rowKey = [];
    var columns = row.split(',');
    for ([index, column] of Object.entries(columns)) {
      if (keyColumnsSet.has(index)) {
        rowKey.push(column);
      }
    }
    data[rowKey.toString()] = columns;
    keys.push(rowKey);
  }
  return {
    data: data,
    keys: keys,
  };
}

function addItemToFlashcard(items, id='#flashcard-list') {
  $(id).empty();

  for (item of items) {
    $(id).append(
      $('<li>')
        .addClass('list-group-item')
        .append(item));
  }
}

function flipCard(data, keys, key) {
  $('#next-btn').off('click');
  var columns = data[key.toString()];

  console.log({columns});
  addItemToFlashcard(columns);

  $('#next-btn').html('Next');
  $('#next-btn').on('click', function() {
    chooseAndDisplayCard(data, keys);
  });
}

function chooseAndDisplayCard(data, keys) {
  $('#next-btn').off('click');
  var key = keys[Math.floor(Math.random() * keys.length)];
  var keyColumn = key[Math.floor(Math.random() * key.length)];

  console.log({keyColumn});
  addItemToFlashcard([keyColumn]);

  $('#next-btn').html('Flip');
  $('#next-btn').on('click', function() {
    flipCard(data, keys, key);
  });
}

$(document).ready(function() {
  if (typeof(Storage) !== 'undefined') {
    $('#csv-data').val(localStorage.getItem('csv-data') || '');
    $('#key-columns').val(localStorage.getItem('key-columns') || '');

    $('#save-btn').on('click', function() {
      localStorage.setItem('csv-data', $('#csv-data').val());
      localStorage.setItem('key-columns', $('#key-columns').val());
    });
  }
  $('#next-btn').on('click', function() {
    var {data, keys} = loadData($('#csv-data').val(), $('#key-columns').val());
    console.log({data, keys});

    $('#next-btn').off('click');
    $('#next-btn').html('Next');
    // This is a fairly primitive way of handling state. However, since we only
    // have three states (one of which only happens once), let's just do it the
    // primitive way (i.e. "continuation-passing" style).
    $('#next-btn').on('click', function() {
      chooseAndDisplayCard(data, keys);
    });
    $('#next-btn').click();
  });
});
