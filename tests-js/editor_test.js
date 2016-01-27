describe('RedPenEditor', function() {
  var ed;

  beforeEach(function() {
    $('body').empty();
    ed = new RedPenEditor();
  });

  describe('plain text', function() {
    var textarea;

    beforeEach(function() {
      textarea = $('<textarea id="content"></textarea>').appendTo('body');
      ed.switchTo('#content');
    });

    it('getDocumentText() returns textarea content', function() {
      textarea.val('Hello World!');
      expect(ed.getDocumentText()).toBe('Hello World!');
    });

    it('showErrorInText() calls setSelectionRange', function() {
      textarea.val('Hello\nWorld!');
      spyOn(textarea[0], 'setSelectionRange');

      var error = {position: {start: {offset: 3, line: 2}, end: {offset: 5, line: 2}}};
      ed.showErrorInText(error);

      expect(textarea[0].setSelectionRange).toHaveBeenCalledWith(9, 11);
    });
  });

  describe('visual (tinyMCE)', function() {
    var editorContent;
    var selection, range;
    var editor = {
      getBody: function() {return $(editorContent)[0]},
      container: document.documentElement,
      selection: {
        getSel: function() {return selection = jasmine.createSpyObj('selection', ['removeAllRanges', 'addRange'])},
        getRng: function() {return range = jasmine.createSpyObj('range', ['selectNode', 'setStart', 'setEnd'])}
      }
    };

    beforeEach(function() {
      ed.switchTo(editor);
    });

    it('getDocumentText() returns text as a single line', function() {
      editorContent = '<div><p>Hello <i>the\u00A0great</i> <strong>WordPress</strong></p>\n<p>and the World!</p></div>';
      expect(ed.getDocumentText()).toBe('Hello the great WordPress and the World!')
    });

    it('highlightError() for zero-length errors does not create an empty node', function() {
      editorContent = '<p>Hello World!</p>';
      var errorNode = ed.highlightError({position: {start: {offset: 0}, end:{offset: 0}}});
      expect(errorNode.textContent).toBe('Hello World!');
    });

    it('highlightError() wraps the text in a span', function() {
      editorContent = '<p>Hello World!</p>';
      var errorNode = ed.highlightError({position: {start: {offset: 0}, end: {offset: 5}}, message: 'Error message'});
      expect(errorNode.className).toBe('redpen-error');
      expect(errorNode.getAttribute('data-mce-bogus')).toBe('1');
      expect(errorNode.getAttribute('title')).toBe('RedPen: Error message');
      expect(errorNode.textContent).toBe('Hello');
    });

    it('showErrorInText() uses Range inside of editor\'s body', function() {
      editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';

      var error = {position: {start: {offset: 23, line: 1}, end: {offset: 28, line: 1}}};
      var errorNode = ed.highlightError(error);
      ed.showErrorInText(error, errorNode);

      expect(errorNode.textContent).toBe('World');
      expect(range.selectNode).toHaveBeenCalledWith(errorNode);
      expect(selection.removeAllRanges).toHaveBeenCalled();
      expect(selection.addRange).toHaveBeenCalledWith(range);
    });
  });
});