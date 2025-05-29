var lang = require("ace/lib/lang");
var modelist = require("ace/ext/modelist");

function Bridge(editor) {
    this.mode = null;
    this.lastTextLength = 0;
    this.editor = editor;
    this.loading = false;

    this.execCommand = function (cmd, data) {
        if (this[cmd]) {
            return this[cmd](data);
        } else {
            alert('Unknown cmd: ' + cmd);
        }
    };

    this.redo = function () {
        editor.redo();
    };

    this.undo = function () {
        editor.undo();
    };

    this.canUndo = function () {
        return editor.session.getUndoManager().hasUndo();
    };

    this.canRedo = function () {
        return editor.session.getUndoManager().hasRedo();
    };

    this.onCopy = function () {
        editor.onCopy();
        editor.clearSelection();
    };

    this.onPaste = function (data) {
        editor.onPaste(data['text']);
        editor.clearSelection();
    };

    this.onCut = function () {
        editor.onCut();
        editor.clearSelection();
    };

    this.duplication = function () {
        editor.duplicateSelection();
        editor.clearSelection();
    };

    this.convertWrapCharTo = function (data) {
        // editor.replaceAll(data['value'], {'needle':"\r\n|\n|\r", 'regExp':true});
        var mode = "auto";
        if (data['value'] === "\r\n") {
            mode = "windows";
        } else if (data['value'] === "\n") {
            mode = "unix";
        }
        editor.getSession().getDocument().setNewLineMode(mode);
    };

    this.gotoTop = function () {
        editor.gotoLine(1, 0)
        editor.navigateFileStart();
    };

    this.gotoEnd = function () {
        var row = editor.session.getLength() - 1;
        editor.gotoLine(row + 1, 0)
        editor.navigateFileEnd();
    };

    this.gotoLine = function (data) {
        editor.gotoLine(data['line'], data['column'], true);
    };

    this.readOnly = function (data) {
        editor.setReadOnly(data['value']);
    };

    this.selectAll = function () {
        editor.selectAll();
    };

    this.forwardLocation = function () {
        // todo
    };

    this.backLocation = function () {
        // todo
    };

    this.insertOrReplaceText = function (data) {
        if (editor.getReadOnly()) return;
        var requireSelected = data['requireSelected'];
        var text = data['text'];
        if (requireSelected && !this.hasSelection()) {
            return;
        }
        editor.insert(text);
    };

    this.hasSelection = function () {
        return !editor.selection.isEmpty();
    };

    this.setSearchResult = function (data) {
        var event = require("ace/lib/event");

        data['file'] = "file.searchresult";
        window.findText = data['find'];
        window.findData = data['data'];

        editor.selection.on('changeCursor', function (e, selection) {
            if (!window.findData) return;
            var lead = selection.getSelectionLead();
            var token = selection.session.getTokenAt(lead.row, lead.column);
            if (!token || token.type !== 'keyword') return;
            var doc = selection.session.getDocument();
            if (lead.row >= window.findData.length) return;
            var data = window.findData[lead.row];
            AndroidEditor.openFile(data['file'], data['line'], data['column']);
        });
        editor.setReadOnly(true);
        this.setText(data);
    };

    this.setText = function (data) {

        this.loading = true;

        var text = data['text'];
        var file = data['file'];
        var modeCls = modelist.getModeForPath(file ? file : '');
        console.log("setText: mode="+modeCls.mode);
        this.setMode({ 'mode': modeCls.mode });
        editor.setValue(text, -1);
        editor.clearSelection();
        var line = data['line'] || 0;
        var column = data['column'] || 0;
        if (line > 0 || column > 0) {
            editor.gotoLine(line, column, true);
        }

        this.resetTextChange();

        editor.session.getUndoManager().reset();

        this.loading = false;
    };

    this.getText = function () {
        return editor.getValue();
    };

    this.getSelectedText = function () {
        var range = editor.getSelection().getRange();
        return editor.session.getTextRange(range);
    };

    this.getLineText = function (data) {
        var line = data['line'];
        var limitLength = data['limitLength'];
        var text = editor.session.getLine(line);
        return text.substring(0, Math.min(limitLength, text.length));
    };

    this.enableHighlight = function (data) {
        var value = data['value'];
        if (value) {
            editor.session.setMode(this.mode);
        } else {
            editor.session.setMode(null);
        }
    };

    this.setMode = function (data) {
        var modelist = require("ace/ext/modelist");
        this.mode = data['mode'];
        editor.session.setMode(this.mode);
        var modeName = "Text";
        var m;
        for (var i in modelist.modes) {
            m = modelist.modes[i];
            if (this.mode == m.mode) {
                modeName = m.caption;
                break;
            }
        }
        AndroidEditor.onModeChanged(modeName);
    };

    /**
     * 保存文件后，设置文本为非改变状态
     */
    this.resetTextChange = function () {
        this.lastTextLength = editor.session.getLength();
        return true;
    };


    this.doFind = function (data) {
        if (data.replaceText) {
            editor.replaceAll(data.replaceText, {
                needle: data.findText,
                caseSensitive: data.caseSensitive,
                regExp: false,
                wholeWord: false,
            });
        } else {
            editor.findAll(data.findText, {
                caseSensitive: data.caseSensitive,
                regExp: false,
                wholeWord: false,
            });
        }
        var range = editor.getSelectionRange();
        var pos = {
            row: Math.floor(range.start.row + (range.end.row - range.start.row) / 2),
            column: Math.floor(range.start.column + (range.end.column - range.start.column) / 2)
        };
        pos = editor.renderer.$cursorLayer.getPixelPosition(pos);
        var h = editor.renderer.$size.scrollerHeight - editor.renderer.lineHeight;
        var offsetY = pos.top - h * 0.5;

        var w = editor.renderer.$size.scrollerWidth - editor.renderer.characterWidth;
        var offsetX = pos.left - w * 0.5;

        editor.renderer.scrollTo(offsetX, offsetY);
    };

    this.setFontSize = function (data) {
        editor.setFontSize(data['value']);
    };

    this.setShowLineNumber = function (data) {
        editor.renderer.setShowGutter(data['value']);
    };

    this.setShowInvisible = function (data) {
        editor.setShowInvisibles(data['value']);
    };

    this.setWordWrap = function (data) {
        editor.session.setUseWrapMode(data['value'] ? true : false);
    };

    this.setTabSize = function (data) {
        editor.session.setTabSize(data['value']);
    };

    this.setAutoIndent = function (data) {
        editor.setOption("enableAutoIndent", data['value']);
    };

    this.setSpaceAsTab = function (data) {
        editor.session.setUseSoftTabs(data['value']);
    };

    this.setZoomable = function (data) {
        editor.setZoomable(data['value']);
    };

    this.setTheme = function (data) {
        editor.setTheme(data['value']);
        setTimeout(function () {
            var style = document.getElementById('theme');
            if (style) {
                style.parentNode.removeChild(style);
            }
        }, 380);
    };

    this.getCurrentPosition = function () {
        var lead = editor.selection.getSelectionLead();
        return [lead.row, lead.column];
    };

    this.clearSelection = function () {
        editor.clearSelection();
    };
}

(function () {
    this.bindEditorEventToJava = function () {
        var self = this;
        this.editor.on("change", function (data) {
            if (self.loading)
                return;
            var len = self.editor.session.getLength();
            AndroidEditor.onTextChanged(len != self.lastTextLength || (len == self.lastTextLength && self.canUndo()));
            self.lastTextLength = len;

        });

        self.selected = false;
        var Range = require("ace/range").Range;
        this.editor.getSelection().on("changeCursor", function () {
            try {
                var cursor = self.editor.getSelection().getCursor();
                var range = new Range(cursor.row, Math.max(0, cursor.column - 30), cursor.row, cursor.column);
                var text = self.editor.session.getTextRange(range);
                AndroidEditor.updateCursorBeforeText(text);
            } catch (e) { }

        });
        this.editor.on("onLongTouch", function () {
            self.showActionMode();
        });
        this.editor.on("onClick", function () {
            if (self.hasSelection())
                return;
            self.hideActionMode();
        });
        this.editor.renderer.scrollBar.on("startScroll", function () {
            AndroidEditor.onScrollStart();
        });
        this.editor.renderer.scrollBar.on("endScroll", function () {
            AndroidEditor.onScrollEnd();
        });


        var updateStatus = function () {

            var sel = editor.selection;
            var c = sel.lead;

            var textContent = (c.row + 1) + ":" + (c.column + 1);

            if (!sel.isEmpty()) {
                textContent += " (" + editor.getSelectedText().length + ")";
            }
            AndroidEditor.onCursorStatusChanged(textContent);
        }

        var statusUpdate = lang.delayedCall(updateStatus.bind(this)).schedule.bind(null, 100);

        this.editor.on("changeStatus", statusUpdate);
        this.editor.on("changeSelection", function () {
            statusUpdate();

            if (self.loading) return;

            var s = self.getSelectedText();
            var selected = !!s;
            AndroidEditor.onSelectionChange(selected, s ? s : '');
            if (selected === self.selected) return;
            self.selected = selected;

            if (s) {
                self.showActionMode();
            } else {
                self.hideActionMode();
            }
        });
    };

    this.actionModeTimer = undefined;
    this.showActionMode = function () {
        if (this.actionModeTimer) {
            clearTimeout(this.actionModeTimer);
        }
        this.actionModeTimer = setTimeout(function () {
            AndroidEditor.showActionMode();
        }, 100);
    };

    this.hideActionMode = function () {
        if (this.actionModeTimer) {
            clearTimeout(this.actionModeTimer);
        }
        this.actionModeTimer = setTimeout(function () {
            AndroidEditor.hideActionMode();
        }, 100);
    };
}).call(Bridge.prototype);