function RedPenEditor() {
  var $ = jQuery;
  var pub = this;

  pub.initFor = function(what) {
    if (what.editorCommands)
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

  pub.showErrorInText = function(error, node) {
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
  pub.isPlainText = function() {
    return false;
  };

  pub.getDocumentText = function() {
    clearEditorErrors();
    return breakTagsIntoLines(editor.getBody());
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

  pub.findTextNodes = findTextNodes;
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

  function clearEditorErrors() {
    $(editor.getBody()).find('.redpen-error').each(function (i, node) {
      $(node).replaceWith(node.childNodes);
    });
    editor.getBody().normalize();
  }
}
