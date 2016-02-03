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

  pub.getCursorPos = function() {};
  pub.setCursorPos = function() {};

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
    editor.onPaste.add(function() {
      setTimeout(handler, 500);
    });
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
    function wrapError(node, start, end) {
      var wrapper = $('<span class="redpen-error" data-mce-bogus="1"></span>')
                    .attr('title', 'RedPen ' + error.index + ': ' + error.message);

      var fromStart = start == 0;
      var tillEnd = end == node.data.length;

      var textWithError = node.data.substring(start, end);

      var tailNode = fromStart ? node : node.splitText(start);
      if (tillEnd) return $(tailNode).wrap(wrapper)[0].parentNode;

      tailNode.data = tailNode.data.substring(textWithError.length);
      return wrapper.text(textWithError).insertBefore(tailNode)[0];
    }

    try {
      var textNodes = findTextNodes();
      var errorNodes = findNodes(textNodes, error.position.start.offset, error.position.end.offset);

      if (errorNodes.length == 1 && errorNodes[0].start == errorNodes[0].end) return [errorNodes[0].node];

      var wrappedTextNodes = [];
      for (var i in errorNodes) {
        var errorNode = errorNodes[i];
        wrappedTextNodes.push(wrapError(errorNode.node, errorNode.start, errorNode.end).childNodes[0]);
      }
      return wrappedTextNodes;
    }
    catch (e) {
      // do not highlight error if text has been changed already
      console.warn(error, textNodes, e);
    }
  };

  pub.showErrorInText = function(error, textNodes) {
    if (error.position.end.offset == error.position.start.offset) {
      pub.setCursorPos(error.position.start.offset);
    }
    else {
      setSelection(textNodes[0], 0, textNodes[textNodes.length-1], textNodes[textNodes.length-1].textContent.length);
    }

    pub.scrollToEditor();
    editor.getBody().focus();
  };

  pub.scrollToEditor = function() {
    var offset = $(editor.container).offset();
    if (pageYOffset > offset.top) scrollTo(offset.left, offset.top);
  };

  pub.getCursorPos = function() {
    var cursorNode = editor.dom.doc.createTextNode('\u200B\u200B\u200B');
    var range = editor.selection.getRng();
    range.insertNode(cursorNode);
    var pos = pub.getDocumentText().indexOf(cursorNode.data);
    $(cursorNode).remove();
    editor.getBody().normalize();
    return pos;
  };

  pub.setCursorPos = function(pos) {
    var textNodes = findTextNodes();
    var res = findNodes(textNodes, pos, pos)[0];
    setSelection(res.node, res.start, res.node, res.end);
  };

  function setSelection(startNode, startOffset, endNode, endOffset) {
    var selection = editor.selection.getSel();
    var range = editor.selection.getRng();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    selection.removeAllRanges();
    selection.addRange(range);
  }

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

  function findNodes(textNodes, posStart, posEnd) {
    var nodes = [];
    for (var i in textNodes) {
      var node = textNodes[i];

      if (i == textNodes.length-1 || posStart < node.data.length)
        nodes.push({node: node, start: 0, end: node.data.length});
      else if (nodes.length == 0)
        posStart -= node.data.length;

      if (posEnd > node.data.length) posEnd -= node.data.length;
      else break;
    }

    nodes[0].start = posStart;
    nodes[nodes.length-1].end = posEnd;

    return nodes;
  }
}
