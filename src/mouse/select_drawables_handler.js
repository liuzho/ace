"use strict";


var dom = require("../lib/dom");
var event = require("../lib/event");
var MouseEvent = require("./mouse_event").MouseEvent;

var auchorRow, auchorColumn;


// function getPointer(editor) {
//     var point = document.getElementById("bdfm-touch-pointer");
//     if (point == undefined) {
//         point = dom.createElement("div");
//         point.id = "bdfm-touch-pointer";
//         point.style.width = "8px";
//         point.style.height = "8px";
//         point.style.backgroundColor = "#ff0000";
//         point.style.position = "absolute";
//         // for debug
//         document.body.appendChild(point);
//     }
//     return point;
// }

class SelectDrawableEventHandler {

    constructor(defaultHandler, mouseHandler, selectors) {
        this.editor = mouseHandler.editor;
        this.leftDownX = 0;
        this.leftDownY = 0;
        this.leftDownXOffset = 0;
        this.leftDownYOffset = 0;

        var _self = this;


        var midDownX = 0;
        var midDownY = 0;

        var midDownY2Pointer = 0;
        var midDownX2Pointer = 0;


        var onMidTouchStart = function (e) {
            selectors.cancelMidTimeout();
            event.stopEvent(e);

            event.callAndroidEditor("hideContextMenu");

            e = _self.getEvent(e);
            midDownX = e.clientX;
            midDownY = e.clientY;

            // console.log("liuzh: handler.start.mid: x="+e.clientX+", y="+e.clientY);
            

            var mouseEvent = new MouseEvent(e, _self.editor);
            mouseEvent.x = mouseEvent.clientX = dom.getElemLeft(this) + this.clientWidth / 2;
            mouseEvent.y = mouseEvent.clientY = dom.getElemTop(this) - _self.editor.renderer.layerConfig.lineHeight / 2;
            
            midDownY2Pointer = midDownY - mouseEvent.y;
            midDownX2Pointer = midDownX - mouseEvent.x;

            // var p = getPointer(_self.editor);
            // p.style.left = mouseEvent.x+"px";
            // p.style.top = mouseEvent.y+"px";

            defaultHandler.onMouseDown.call(mouseHandler, mouseEvent);
        };

        event.addListener(selectors.selectHandleMid, "touchstart", onMidTouchStart);

        event.addListener(selectors.selectHandleMid, "touchmove", function (e) {
            selectors.cancelMidTimeout();
            event.stopEvent(e);
            e = _self.getEvent(e);
            var mouseEvent = new MouseEvent(e, _self.editor);

            mouseEvent.x = mouseEvent.clientX = e.clientX - midDownX2Pointer;
            // console.log("me.x=" + mouseEvent.x + ", me.clentX=" + mouseEvent.clientX);
            mouseEvent.y = mouseEvent.clientY = e.clientY - midDownY2Pointer;

            defaultHandler.onMouseDown.call(mouseHandler, mouseEvent);
        });

        var onMidTouchEnd = function (e) {
            selectors.hideMidSelectHandleTimeout();
        };

        event.addListener(selectors.selectHandleMid, "touchend", onMidTouchEnd);
        event.addListener(selectors.selectHandleMid, "touchcancel", onMidTouchEnd);


        var onTouchStart = this.onTouchStart.bind(this);
        var onTouchMove = this.onTouchMove.bind(this);

        var onTouchEnd = function (e) {
            selectors.ignoreUpdate = false;
            var config = _self.editor.renderer.layerConfig;
            // reset handlers position
            selectors.update(config);
            var setMode = require("./touch_handler").setMode;
            setMode("");

            var start = _self.editor.selection.getSelectionLead();
            var screen = _self.editor.renderer.textToScreenCoordinates(start.row, start.column);
            var doc = _self.editor.container && _self.editor.container.ownerDocument;
            var win = doc && doc.defaultView;
            var scrollLeft = win ? (win.pageXOffset || doc.documentElement.scrollLeft || 0) : 0;
            var scrollTop = win ? (win.pageYOffset || doc.documentElement.scrollTop || 0) : 0;
            var x = screen.pageX + scrollLeft;
            var y = screen.pageY + scrollTop;
            y -= Math.round(config && config.lineHeight ? config.lineHeight * 1.5 : 24);
            var rect = _self.editor.container && _self.editor.container.getBoundingClientRect && _self.editor.container.getBoundingClientRect();
            if (rect && rect.right > rect.left && rect.bottom > rect.top) {
                var pageLeft = rect.left + scrollLeft;
                var pageRight = rect.right + scrollLeft;
                var pageTop = rect.top + scrollTop;
                var pageBottom = rect.bottom + scrollTop;
                if (x < pageLeft) x = pageLeft;
                if (x > pageRight) x = pageRight;
                if (y < pageTop) y = pageTop;
                if (y > pageBottom) y = pageBottom;
            }
            event.callAndroidEditor("showContextMenu", x, y);
            var hideMenu = function () {
                event.callAndroidEditor("hideContextMenu");
                _self.editor.off("input", hideMenu);
            };
            _self.editor.on("input", hideMenu);
        };

        event.addListener(selectors.selectHandleLeft, "touchstart", onTouchStart);
        event.addListener(selectors.selectHandleLeft, "touchmove", onTouchMove);
        event.addListener(selectors.selectHandleLeft, "touchend", onTouchEnd);
        event.addListener(selectors.selectHandleLeft, "touchcancel", onTouchEnd);

        event.addListener(selectors.selectHandleRight, "touchstart", onTouchStart);
        event.addListener(selectors.selectHandleRight, "touchmove", onTouchMove);
        event.addListener(selectors.selectHandleRight, "touchend", onTouchEnd);
        event.addListener(selectors.selectHandleRight, "touchcancel", onTouchEnd);
    }

    getEvent(e) {
        var touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
        return touch || e;
    }

    onTouchStart(e) {
        // console.log("liuzh: onTouchStart.");

        event.stopEvent(e);
        e = this.getEvent(e);

        event.callAndroidEditor("hideContextMenu");

        var selectors = this.editor.renderer.$selectorLayer;
        selectors.ignoreUpdate = true;

        var elem = e.target || e.srcElement;

        this.leftDownX = e.clientX;
        this.leftDownY = e.clientY;
        this.leftDownXOffset = e.clientX - dom.getElemLeft(elem);
        this.leftDownYOffset = e.clientY - dom.getElemTop(elem);

        // console.log("liuzh: downX=" + this.leftDownX + ", elemLeft=" + dom.getElemLeft(elem) + ", offX=" + this.leftDownXOffset + ", offY=" + this.leftDownYOffset);


        var selection = this.editor.selection;

        var isRightHandler = dom.hasCssClass(elem, "ace_r_select_handle");

        var anchor = selection.getSelectionAnchor();
        var lead = selection.getSelectionLead();

        var screenX = isRightHandler
            ? dom.getElemLeft(elem) + 11
            : dom.getElemLeft(elem) + elem.clientWidth - 11;
        var screenY = dom.getElemTop(elem) - this.editor.renderer.layerConfig.lineHeight / 2;
        var pos = this.editor.renderer.screenToTextCoordinates(screenX, screenY);
        // console.log("liuzh: downPos=("+pos.row+","+pos.column+")");
        
        if (pos.row == lead.row && lead.column == pos.column) {
            auchorRow = anchor.row;
            auchorColumn = anchor.column;
        } else {
            auchorRow = lead.row;
            auchorColumn = lead.column;
        }
        // console.log("onTouchStart: auchorRow=" + auchorRow + ", auchorColumn=" + auchorColumn);
    }

    onTouchMove(e) {
        event.stopEvent(e);
        e = this.getEvent(e);

        var selectors = this.editor.renderer.$selectorLayer;


        var elem = e.target || e.srcElement;
        var isRightHandler = dom.hasCssClass(elem, "ace_r_select_handle");
        // marginLeft in css
        var marginLeft = isRightHandler ? 11 : 33;

        var cursorLayer = this.editor.renderer.$cursorLayer.element;
        var cursorLeft = dom.getElemLeft(cursorLayer);
        var cursorTop = dom.getElemTop(cursorLayer);

        var elemScreenLeft = e.clientX - this.leftDownXOffset;
        var elemScreenTop = e.clientY - this.leftDownYOffset;

        var left = elemScreenLeft - cursorLeft + marginLeft;
        var top = elemScreenTop - cursorTop;

        var x = isRightHandler
            ? elemScreenLeft + 11
            : elemScreenLeft + elem.clientWidth - 11;
        var y = elemScreenTop - this.editor.renderer.layerConfig.lineHeight / 2;

        // console.log("liuzh: lr.move: cursorLeft="+cursorLeft+", offX="+this.leftDownXOffset+", scrollLeft="+this.editor.renderer.scrollLeft);
        

        var pos = this.editor.renderer.screenToTextCoordinates(x, y);
        var selection = this.editor.selection;


        elem.style.left = left + "px";
        elem.style.top = top + "px";

        // var pointer = getPointer(this.editor);
        // pointer.style.left = (x - pointer.clientWidth / 2) + "px";
        // pointer.style.top = (y - pointer.clientHeight / 2) + "px";


        var auchor = selection.getSelectionAnchor();
        var lead = selection.getSelectionLead();
        // console.log("row=" + auchorRow + " col=" + auchorColumn + " -> row=" + pos.row + " col=" + pos.column);
        if (pos.row == auchorRow && pos.column == auchorColumn) {
            return;
        }

        this.editor.selection.setSelectionAnchor(auchorRow, auchorColumn);
        this.editor.selection.selectToPosition(pos);
        this.editor.renderer.scrollCursorIntoView();
    }

}

exports.SelectDrawableEventHandler = SelectDrawableEventHandler;
