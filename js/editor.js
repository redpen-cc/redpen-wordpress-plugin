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

  pub.getDocumentText = function() {
    return textarea.val();
  };

  pub.onKeyUp = function(handler) {
    textarea.on('keyup', handler);
  };

  pub.clearErrors = function() {};

  pub.highlightError = function(error) {
    // not supported yet
  };

  pub.showErrorInText = function(error) {
    var start = calculateGlobalOffset(error.position.start);
    var end = calculateGlobalOffset(error.position.end);
    textarea[0].setSelectionRange(start, end);
    pub.scrollToEditor();
  };

  pub.scrollToEditor = function() {
    var offset = textarea.parent().offset();
    if (pageYOffset > offset.top) scrollTo(offset.left, offset.top);
  };

  function calculateGlobalOffset(position) {
    var lines = pub.getDocumentText().split('\n');
    var offset = position.offset;
    for (var i = 0; i < position.line - 1; i++) offset += lines[i].length + 1;
    return offset;
  }
}

function RedPenVisualEditor(pub, $, editor) {
  pub.getDocumentText = function() {
    return editor.getBody().textContent.replace(/[\n\u00A0]/g, ' ');
  };

  pub.onKeyUp = function(handler) {
    editor.onKeyUp.add(handler);
  };

  pub.clearErrors = function() {
    var cursorPos = pub.getCursorPos();
    $(editor.getBody()).find('.redpen-error').each(function(i, node) {
      $(node).replaceWith(node.childNodes);
    });
    editor.getBody().normalize();
    pub.setCursorPos(cursorPos);
  };

  pub.highlightError = function(error) {
    var textNodes = findTextNodes();
    var cursorPos = pub.getCursorPos(textNodes);
    try {
      var start = findNode(textNodes, error.position.start.offset);
      var end = findNode(textNodes, error.position.end.offset);
      var node = start.node;
      if (end.node != node) return end.node;
      if (end.offset - start.offset == 0) return node;
      var textWithError = node.data.substring(start.offset, end.offset);

      var tailNode = node.splitText(start.offset);
      tailNode.data = tailNode.data.substring(textWithError.length);

      return $('<span class="redpen-error" data-mce-bogus="1"></span>')
        .attr('title', 'RedPen ' + error.index + ': ' + error.message).text(textWithError)
        .insertBefore(tailNode)[0];
    }
    catch (e) {
      // do not highlight error if text has been changed already
      console.warn(error, textNodes, e);
    }
    finally {
      pub.setCursorPos(cursorPos);
    }
  };

  pub.showErrorInText = function(error, node) {
    if (error.position.end.offset - error.position.start.offset == 0) {
      pub.setCursorPos(error.position.start.offset);
    }
    else {
      var selection = editor.selection.getSel();
      var range = editor.selection.getRng();
      range.selectNode(node);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    pub.scrollToEditor();
    editor.getBody().focus();
  };

  pub.scrollToEditor = function() {
    var offset = $(editor.container).offset();
    if (pageYOffset > offset.top) scrollTo(offset.left, offset.top);
  };

  pub.getCursorPos = function(textNodes) {
    if (!textNodes) textNodes = findTextNodes();
    var range = editor.selection.getRng();
    var pos = range.startOffset;
    $.each(textNodes, function(i, node) {
      if (node != range.startContainer) pos += node.data.length;
      else return false;
    });
    return pos;
  };

  pub.setCursorPos = function(pos) {
    var textNodes = findTextNodes();
    var res = findNode(textNodes, pos);
    var range = editor.selection.getRng();
    var selection = editor.selection.getSel();
    range.setStart(res.node, res.offset);
    range.setEnd(res.node, res.offset);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  function findTextNodes() {
    var textNodes = [];
    function recurse(i, node) {
      if (node.nodeType == node.TEXT_NODE)
        textNodes.push(node);
      $.each(node.childNodes, recurse);
    }
    recurse(0, editor.getBody());
    return textNodes;
  }

  function findNode(textNodes, pos) {
    var node;
    for (var i = 0; i < textNodes.length; i++) {
      node = textNodes[i];
      if (pos > node.data.length) pos -= node.data.length;
      else break;
    }
    return {node:node, offset:pos};
  }
}
