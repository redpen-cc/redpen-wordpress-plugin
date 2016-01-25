function RedPenEditor() {
  var $ = jQuery;
  var pub = this;

  pub.switchTo = function(what) {
    if (what.getBody)
      RedPenVisualEditor(pub, $, what);
    else
      RedPenPlainEditor(pub, $, what);
  };
}

function RedPenPlainEditor(pub, $, textarea) {
  textarea = $(textarea);

  pub.isPlainText = function() {
    return true;
  };

  pub.getDocumentText = function() {
    return textarea.val();
  };

  pub.onKeyUp = function(handler) {
    textarea.on('keyup', handler);
  };

  pub.highlightError = function(error) {
    // not supported yet
  };

  pub.showErrorInText = function(error) {
    var start = calculateGlobalOffset(error.position.start);
    var end = calculateGlobalOffset(error.position.end);
    textarea[0].setSelectionRange(start, end);
  };

  function calculateGlobalOffset(position) {
    var lines = textarea.val().split('\n');
    var offset = position.offset;
    for (var i = 0; i < position.line - 1; i++) offset += lines[i].length + 1;
    return offset;
  }
}

function RedPenVisualEditor(pub, $, editor) {
  var textNodes;

  pub.isPlainText = function() {
    return false;
  };

  pub.getDocumentText = function() {
    clearEditorErrors();
    return breakTagsIntoLines(editor.getBody());
  };

  pub.onKeyUp = function(handler) {
    editor.onKeyUp.add(handler);
  };

  pub.highlightError = function(error) {
    var node = textNodes[error.position.start.line-1];
    var textWithError = node.data.substring(error.position.start.offset, error.position.end.offset);

    var tailNode = node.splitText(error.position.start.offset);
    tailNode.data = tailNode.data.substring(textWithError.length);

    return $('<span class="redpen-error" data-mce-bogus="1"></span>')
      .attr('title', 'RedPen: ' + error.message).text(textWithError)
      .insertBefore(tailNode)[0];
  };

  pub.showErrorInText = function(error, node) {
    var selection = editor.selection.getSel();
    var range = editor.selection.getRng();
    range.selectNode(node);
    selection.removeAllRanges();
    selection.addRange(range);

    var offset = $(editor.container).offset();
    if (scrollY > offset.top) scrollTo(offset.left, offset.top);
    editor.getBody().focus();
  };

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
    textNodes = findTextNodes(node);
    return textNodes.map(function(node) {return node.textContent}).join('\n');
  }

  function clearEditorErrors() {
    $(editor.getBody()).find('.redpen-error').each(function (i, node) {
      $(node).replaceWith(node.childNodes);
    });
    editor.getBody().normalize();
  }
}
