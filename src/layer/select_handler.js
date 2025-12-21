"use strict";

const { EditSession } = require("../edit_session");
var dom = require("../lib/dom");

class SelectHandleDrawables {
    constructor(cursor) {
        this.isMidVisible = false;
        this.isLRVisible = false;
        this.ignoreUpdate = false;
        this.cursor = cursor;

        this.hideMidTimeout = undefined;

        this.scrollerElement = this.$findParentElement(cursor.element, "ace_scroller");
        this.containerElement = this.$findParentElement(cursor.element, "ace_editor");
        this.element = dom.createElement("div");
        this.element.style.position = "absolute";
        this.element.style.left = "0px";
        this.element.style.top = "0px";
        this.element.style.right = "0px";
        this.element.style.bottom = "0px";
        this.element.style.zIndex = "1000";
        this.element.style.pointerEvents = "none";
        this.element.setAttribute("aria-hidden", "true");
        (this.containerElement || cursor.element).appendChild(this.element);

        this.addSelectHandle();
        this.$onSelectionChange = this.onSelectionChange.bind(this);
    }

    $findParentElement(element, cssClass) {
        while (element) {
            if (element.nodeType === 1 && dom.hasCssClass(element, cssClass))
                return element;
            element = element.parentNode;
        }
        return null;
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
            this.session.selection.off("changeSelection", this.$onSelectionChange);
        }
        this.session = session;
        if (this.session) {
            this.session.selection.on("changeSelection", this.$onSelectionChange);
        }
    }

    setAceEditor(editor) {
        this.editor = editor;
    }


    addSelectHandle() {
        this.selectHandleLeft = dom.createElement("img");
        this.selectHandleLeft.className = "ace_select_handle ace_l_select_handle";
        this.selectHandleLeft.style.display = "none";
        this.selectHandleLeft.style.zIndex = "1001";
        this.selectHandleLeft.style.pointerEvents = "auto";
        this.selectHandleLeft.src = "img/text_select_handle_left.png";
        this.element.appendChild(this.selectHandleLeft);

        this.selectHandleMid = dom.createElement("img");
        this.selectHandleMid.className = "ace_select_handle ace_mid_select_handle";
        this.selectHandleMid.style.display = "none";
        this.selectHandleMid.style.zIndex = "1001";
        this.selectHandleMid.style.pointerEvents = "auto";
        this.selectHandleMid.src = "img/text_select_handle_middle.png";
        this.element.appendChild(this.selectHandleMid);

        this.selectHandleRight = dom.createElement("img");
        this.selectHandleRight.className = "ace_select_handle ace_r_select_handle";
        this.selectHandleRight.style.display = "none";
        this.selectHandleRight.style.zIndex = "1001";
        this.selectHandleRight.style.pointerEvents = "auto";
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

        var selection = this.session && this.session.selection;
        if (!selection)
            return;

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
        if (!this.scrollerElement || !this.containerElement || !this.cursor || !this.cursor.config)
            return;

        var scrollLeft = this.session.getScrollLeft();
        var scrollTop = this.session.getScrollTop();

        var containerRect = this.containerElement.getBoundingClientRect();
        var scrollerRect = this.scrollerElement.getBoundingClientRect();

        var startPixel = this.cursor.getPixelPosition(start);
        var startX = scrollerRect.left + startPixel.left - scrollLeft - containerRect.left;
        var startY = scrollerRect.top + startPixel.top - scrollTop - containerRect.top + config.lineHeight;

        var style;
        if (anchor.row == lead.row &&
            anchor.column == lead.column) {
            //no selection
            style = this.selectHandleMid.style;
            style.left = startX + "px";
            style.top = startY + "px";
            this.hideLeftRightSelectHandle();
        } else {
            style = this.selectHandleLeft.style;
            style.left = startX + "px";
            style.top = startY + "px";

            var endPixel = this.cursor.getPixelPosition(end);
            var endX = scrollerRect.left + endPixel.left - scrollLeft - containerRect.left;
            var endY = scrollerRect.top + endPixel.top - scrollTop - containerRect.top + config.lineHeight;

            style = this.selectHandleRight.style;
            style.left = endX + "px";
            style.top = endY + "px";

            if (!this.isLRVisible) this.showLeftRightSelectHandle();
        }
    }

    destroy() {
        this.cancelMidTimeout();
        if (this.element && this.element.parentNode)
            this.element.parentNode.removeChild(this.element);
    }
}

exports.SelectHandleDrawables = SelectHandleDrawables;
