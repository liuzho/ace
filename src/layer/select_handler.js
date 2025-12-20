"use strict";

const { EditSession } = require("../edit_session");
var dom = require("../lib/dom");

class SelectHandleDrawables {
    constructor(cursor) {
        this.isMidVisible = false;
        this.isLRVisible = false;
        this.ignoreUpdate = false;
        this.element = cursor.element;
        this.cursor = cursor;

        this.hideMidTimeout = undefined;

        this.addSelectHandle();
    }

    onSelectionChange(e) {
        if (this.config) {
            this.update(this.config);
        }
    }

    /**
     * @param {EditSession} session 
     */
    setSession(session) {
        if (this.session) {
            this.session.selection.off("changeSelection", this.onSelectionChange.bind(this));
        }
        this.session = session;
        this.session.selection.on("changeSelection", this.onSelectionChange.bind(this));
    }

    setAceEditor(editor) {
        this.editor = editor;
    }


    addSelectHandle() {
        this.selectHandleLeft = dom.createElement("img");
        this.selectHandleLeft.className = "ace_select_handle ace_l_select_handle";
        this.selectHandleLeft.style.display = "none";
        this.selectHandleLeft.style.zIndex = "999";
        this.selectHandleLeft.src = "img/text_select_handle_left.png";
        this.element.appendChild(this.selectHandleLeft);

        this.selectHandleMid = dom.createElement("img");
        this.selectHandleMid.className = "ace_select_handle ace_mid_select_handle";
        this.selectHandleMid.style.display = "none";
        this.selectHandleMid.src = "img/text_select_handle_middle.png";
        this.element.appendChild(this.selectHandleMid);

        this.selectHandleRight = dom.createElement("img");
        this.selectHandleRight.className = "ace_select_handle ace_r_select_handle";
        this.selectHandleRight.style.display = "none";
        this.selectHandleRight.src = "img/text_select_handle_right.png";

        this.element.appendChild(this.selectHandleRight);

    }

    showMidSelectHandle() {
        this.cancelMidTimeout();
        this.isMidVisible = true;
        this.selectHandleMid.style.display = "";
        this.hideLeftRightSelectHandle();
        this.hideMidSelectHandleTimeout();
    }

    showLeftRightSelectHandle() {
        this.isLRVisible = true;
        this.selectHandleLeft.style.display = "";
        this.selectHandleRight.style.display = "";
        this.hideMidSelectHandle();
    }

    hideMidSelectHandle() {
        this.selectHandleMid.style.display = "none";
        this.isMidVisible = false;
    }

    hideMidSelectHandleTimeout() {
        this.cancelMidTimeout();
        this.hideMidTimeout = setTimeout(() => {
            this.hideMidSelectHandle();
        }, 2000);
    }

    cancelMidTimeout() {
        if (this.hideMidTimeout != undefined) {
            clearTimeout(this.hideMidTimeout);
            this.hideMidTimeout = undefined;
        }
    }

    hideLeftRightSelectHandle() {
        this.selectHandleLeft.style.display = "none";
        this.selectHandleRight.style.display = "none";
        this.isLRVisible = false;
    }

    update(config) {

        if (this.ignoreUpdate) {
            return;
        }
        this.config = config;
        // console.trace("update drawable");
        if (!this.cursor.isVisible) {
            if (this.isMidVisible) this.hideMidSelectHandle();
            if (this.isLRVisible) this.hideLeftRightSelectHandle();
            return;
        }

        var selection = this.cursor.session.selection;

        var lead = selection.getSelectionLead();
        var anchor = selection.getSelectionAnchor();

        var start, end;
        if (anchor.row < lead.row || (anchor.row == lead.row && anchor.column < lead.column)) {
            start = anchor;
            end = lead;
        } else {
            start = lead;
            end = anchor;
        }
        var startPos = this.cursor.session.documentToScreenPosition(start);
        var startCursorLeft = this.cursor.$padding + startPos.column * config.characterWidth;
        var startCursorTop = (startPos.row - config.firstRowScreen) * config.lineHeight + config.lineHeight;

        var style;
        var transX = 0;// dom.getElemLeft(this.element);
        var transY = 0;// dom.getElemTop(this.element);
        if (anchor.row == lead.row &&
            anchor.column == lead.column) {
            //no selection
            style = this.selectHandleMid.style;
            style.left = (transX + startCursorLeft) + "px";
            style.top = (transY + startCursorTop) + "px";
            this.hideLeftRightSelectHandle();
        } else {
            style = this.selectHandleLeft.style;
            style.left = (transX + startCursorLeft) + "px";
            style.top = (transY + startCursorTop) + "px";

            var endPos = this.cursor.session.documentToScreenPosition(end);
            var endCursorLeft = this.cursor.$padding + endPos.column * config.characterWidth;
            var endCursorTop = (endPos.row - config.firstRowScreen) * config.lineHeight + config.lineHeight;

            style = this.selectHandleRight.style;
            style.left = (transX + endCursorLeft) + "px";
            style.top = (transY + endCursorTop) + "px";

            if (!this.isLRVisible) this.showLeftRightSelectHandle();
        }
    }

    destroy() {

    }
}

exports.SelectHandleDrawables = SelectHandleDrawables;
