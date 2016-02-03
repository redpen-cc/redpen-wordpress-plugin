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
        getRng: function() {return range = jasmine.createSpyObj('range', ['setStart', 'setEnd'])}
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
      var errorNode = ed.highlightError({position: {start: {offset: 0}, end:{offset: 0}}})[0];
      expect(errorNode.textContent).toBe('Hello World!');
    });

    it('highlightError() wraps the text in a span', function() {
      editorContent = '<p>Hello World!</p>';
      var errorNode = ed.highlightError({position: {start: {offset: 0}, end: {offset: 5}}, message: 'Error message', index: 5})[0];
      expect(errorNode.className).toBe('redpen-error');
      expect(errorNode.getAttribute('data-mce-bogus')).toBe('1');
      expect(errorNode.getAttribute('title')).toBe('RedPen 5: Error message');
      expect(errorNode.textContent).toBe('Hello');
    });

    it('highlightError() when error spans multiple nodes', function() {
      editorContent = '<p><b>Hel</b>lo <i>World</i>!</p>';
      var errorNodes = ed.highlightError({position: {start: {offset: 0}, end: {offset: 8}}});
      expect(errorNodes[0].className).toBe('redpen-error');
      expect(errorNodes[0].textContent).toBe('Hel');
      expect(errorNodes[1].className).toBe('redpen-error');
      expect(errorNodes[1].textContent).toBe('lo ');
      expect(errorNodes[2].className).toBe('redpen-error');
      expect(errorNodes[2].textContent).toBe('Wo');
    });

    it('showErrorInText() selects single node', function() {
      editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';

      var error = {position: {start: {offset: 23, line: 1}, end: {offset: 28, line: 1}}};
      var errorNodes = ed.highlightError(error);
      ed.showErrorInText(error, errorNodes);

      expect(errorNodes[0].textContent).toBe('World');
      expect(range.setStart).toHaveBeenCalledWith(errorNodes[0], 0);
      expect(range.setEnd).toHaveBeenCalledWith(errorNodes[0], 5);
      expect(selection.removeAllRanges).toHaveBeenCalled();
      expect(selection.addRange).toHaveBeenCalledWith(range);
    });

    it('showErrorInText() selects a range of nodes', function() {
      var error = {position: {start: {offset: 3}, end: {offset: 28}}};
      var errorNodes = [jasmine.createSpy(), jasmine.createSpy()];
      errorNodes[1].textContent = 'World';
      ed.showErrorInText(error, errorNodes);

      expect(range.setStart).toHaveBeenCalledWith(errorNodes[0], 0);
      expect(range.setEnd).toHaveBeenCalledWith(errorNodes[1], 5);
      expect(selection.removeAllRanges).toHaveBeenCalled();
      expect(selection.addRange).toHaveBeenCalledWith(range);
    });

    it('showErrorInText() for zero-length error puts cursor to the correct offset', function() {
      editorContent = '<p>Hello</p>';

      var error = {position: {start: {offset: 2}, end: {offset: 2}}};
      var errorNodes = ed.highlightError(error);
      ed.showErrorInText(error, errorNodes);

      expect(errorNodes[0].textContent).toBe('Hello');
      expect(range.setStart).toHaveBeenCalledWith(errorNodes[0], 2);
      expect(range.setEnd).toHaveBeenCalledWith(errorNodes[0], 2);
      expect(selection.removeAllRanges).toHaveBeenCalled();
      expect(selection.addRange).toHaveBeenCalledWith(range);
    });
  });
});