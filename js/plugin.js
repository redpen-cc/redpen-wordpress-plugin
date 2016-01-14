function RedPenPlugin(baseUrl, textarea, editor) {
  var pub = this;
  var $ = jQuery;
  textarea = $(textarea);

  redpen.setBaseUrl(baseUrl);
  redpen.getRedPens(function(result) {
    pub.config = result.redpens.default;
  });

  pub.validate = function() {
    var container = $('.redpen-error-list').empty();
    var title = $('.redpen-title');

    var args = {config:pub.config, document:getDocumentText(textarea), documenParser:'PLAIN', format:'json2'};

    redpen.validateJSON(args, function(result) {
      $.each(result.errors, function(i, error) {

        $.each(error.errors, function(j, suberror) {
          var message = $('<li class="redpen-error-message"></li>').text(suberror.message)
            .appendTo(container)
            .data('error', suberror)
            .on('click', function() {pub.showErrorInText(this, textarea);});

          $('<div class="redpen-error-validator"></div>')
            .text(suberror.validator)
            .appendTo(message);
        });
      });

      title.html('<span class="redpen-red">Red</span>Pen found ' + container.children().length + ' errors');
    });
  };

  pub.startValidation = function() {
    var lastText, lastKeyUp;

    function validateOnKeyUp() {
      clearTimeout(lastKeyUp);
      lastKeyUp = setTimeout(function() {
        var text = getDocumentText();
        if (text != lastText) {
          pub.validate();
          lastText = text;
        }
      }, 500);
    }

    textarea.on('keyup', validateOnKeyUp);

    if (editor && editor.onKeyUp)
      editor.onKeyUp.add(validateOnKeyUp);

    validateOnKeyUp();
  };

  function isPlainText() {
    return textarea.is(':visible');
  }

  function findTextNodes(node) {
    var textNodes = [];
    function recurse(i, node) {
      if (node.nodeType == node.TEXT_NODE)
        textNodes.push(node);
      $.each(node.childNodes, recurse);
    }
    recurse(0, node);
    return textNodes;
  }

  function breakTagsIntoLines(node) {
    var textNodes = findTextNodes(node);
    return textNodes.map(function(node) {return node.textContent}).join('\n');
  }

  pub._getDocumentText = getDocumentText;
  function getDocumentText() {
    if (isPlainText())
      return textarea.val();
    else
      return breakTagsIntoLines(editor.getBody());
  }

  function calculateGlobalOffset(textarea, position) {
    var lines = textarea.val().split('\n');
    var offset = position.offset;
    for (var i = 0; i < position.line - 1; i++) offset += lines[i].length + 1;
    return offset;
  }

  pub.showErrorInText = function(li, textarea) {
    var error = $(li).data('error');

    if (isPlainText()) {
      var start = calculateGlobalOffset(textarea, error.position.start);
      var end = calculateGlobalOffset(textarea, error.position.end);
      textarea[0].setSelectionRange(start, end);
    }
    else {
      var selection = editor.selection.getSel();
      var range = editor.selection.getRng();
      var textNodes = findTextNodes(editor.getBody());
      range.setStart(textNodes[error.position.start.line-1], error.position.start.offset);
      range.setEnd(textNodes[error.position.end.line-1], error.position.end.offset);
      selection.removeAllRanges();
      selection.addRange(range);
      editor.getBody().focus();
    }
  };
}
