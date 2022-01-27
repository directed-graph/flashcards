
// API key is public, but restricted to domain.
const SHEETS_API_KEY = 'AIzaSyDTA94TIL0ajcLOkBbsIdKKZ7IqambgVWU';
const SHEETS_API_URL = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const MAX_RANGE = '1:10000';

async function getSheetData(sheetId, range) {
    let results = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
    });
    return results.result.values;
}

function parseRawData(rawData, keyColumns) {
  let data = {}
  let keys = [];
  let keyColumnsSet = new Set(keyColumns.split(','));

  for (let row of rawData) {
    let rowKey = [];
    for ([index, column] of Object.entries(row)) {
      if (keyColumnsSet.has(index)) {
        rowKey.push(column);
      }
    }
    data[rowKey.toString()] = row;
    keys.push(rowKey);
  }

  return { data, keys, };
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
  let columns = data[key.toString()];

  console.log({columns});
  addItemToFlashcard(columns);

  $('#next-btn').html('Next');
  $('#next-btn').on('click', function() {
    chooseAndDisplayCard(data, keys);
  });
}

function chooseAndDisplayCard(data, keys) {
  $('#next-btn').off('click');
  let key = keys[Math.floor(Math.random() * keys.length)];
  let keyColumn = key[Math.floor(Math.random() * key.length)];

  console.log({keyColumn});
  addItemToFlashcard([keyColumn]);

  $('#next-btn').html('Flip');
  $('#next-btn').on('click', function() {
    flipCard(data, keys, key);
  });
}

function initialize(sheetsEnabled=true) {
  if (typeof(Storage) !== 'undefined') {
    $('#sheet-id').val(localStorage.getItem('sheet-id') || '');
    $('#csv-data').val(localStorage.getItem('csv-data') || '');
    $('#key-columns').val(localStorage.getItem('key-columns') || '');

    $('#save-btn').on('click', function() {
      localStorage.setItem('sheet-id', $('#sheet-id').val());
      localStorage.setItem('csv-data', $('#csv-data').val());
      localStorage.setItem('key-columns', $('#key-columns').val());
    });
  }

  if (!sheetsEnabled) {
    $('#sheet-id').val('');
    $('#sheet-id').prop('disabled', true);
  }

  $('#next-btn').on('click', async function() {
    let data;
    let keys;
    let sheetId = $('#sheet-id').val();
    let keyColumns = $('#key-columns').val();
    let csvData =$('#csv-data').val();

    if (sheetId) {
      ({data, keys} = parseRawData(await getSheetData(sheetId, MAX_RANGE),
                                   keyColumns));
    } else if (csvData) {
      // EXTREMELY naive CSV parser. But since it only runs locally...
      ({data, keys} = parseRawData(csvData.split('\n').map(c => c.split(',')),
                                   keyColumns));
    } else {
      $('#configure-btn').click();
      return;
    }

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
}

$(document).ready(function() {
  gapi.load('client', function() {
      gapi.client.setApiKey(SHEETS_API_KEY);
      gapi.client.load(SHEETS_API_URL)
          .then(initialize,
              (err) => {
                console.error('Error loading GAPI client', err);
                initialize(false);
              });
  });
});
