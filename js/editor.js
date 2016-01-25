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
}

function RedPenVisualEditor(pub, $, editor) {
  pub.isPlainText = function() {
    return false;
  };

  pub.getDocumentText = function() {
    clearEditorErrors();
    return breakTagsIntoLines(editor.getBody());
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
