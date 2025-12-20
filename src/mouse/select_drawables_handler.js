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
            mouseEvent.x = mouseEvent.clientX = dom.getElemLeft(this) + this.clientWidth / 2 - _self.editor.renderer.scrollLeft;
            // console.log("me.x=" + mouseEvent.x + ", me.clentX=" + mouseEvent.clientX);
            mouseEvent.y = mouseEvent.clientY = e.clientY - _self.editor.renderer.layerConfig.lineHeight / 3 - (e.clientY - dom.getElemTop(this)) - _self.editor.renderer.layerConfig.offset;
            // console.log("me.y=" + mouseEvent.y + ", me.clentY=" + mouseEvent.clientY);
            // console.log("liuzh: midTop="+dom.getElemTop(this)+", diff="+(e.clientY - dom.getElemTop(this)));
            
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
            var cursor = _self.editor.renderer.$cursorLayer;
            var config = _self.editor.renderer.layerConfig;
            // reset handlers position
            selectors.update(config);
            var start = _self.editor.selection.getSelectionLead();
            var startPos = cursor.session.documentToScreenPosition(start);
            var startCursorLeft = cursor.$padding + startPos.column * config.characterWidth;
            var startCursorTop = (startPos.row - config.firstRowScreen) * config.lineHeight;
            var transX = dom.getElemLeft(cursor.element) - _self.editor.renderer.scrollLeft;
            var transY = dom.getElemTop(cursor.element) - _self.editor.renderer.layerConfig.offset;
            var setMode = require("./touch_handler").setMode;
            setMode("");

            event.callAndroidEditor("showContextMenu", transX + startCursorLeft, transY + startCursorTop);
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

        var cursorLayerLeft = dom.getElemLeft(this.editor.renderer.$cursorLayer.element);

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

        var x;
        if (isRightHandler) {
            x = dom.getElemLeft(elem) - cursorLayerLeft + 11;
        } else {
            x = dom.getElemLeft(elem) - cursorLayerLeft + elem.clientWidth + -11/*margin in css*/;
        }
        x -= this.editor.renderer.scrollLeft;
        var y = dom.getElemTop(elem) - this.editor.renderer.layerConfig.lineHeight / 2 - this.editor.renderer.layerConfig.offset;

        // var pointer = getPointer(this.editor);
        // pointer.style.left = (x - pointer.clientWidth / 2) + "px";
        // pointer.style.top = (y - pointer.clientHeight / 2) + "px";

        var screenX = x + cursorLayerLeft;
        var screenY = y;
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

        var cursorLeft = dom.getElemLeft(this.editor.renderer.$cursorLayer.element);
        var left = e.clientX - this.leftDownXOffset - cursorLeft + marginLeft;
        var top = e.clientY - this.leftDownYOffset;

        var x = left + cursorLeft - this.editor.renderer.scrollLeft;
        var y = top - this.editor.renderer.layerConfig.lineHeight / 2 - this.editor.renderer.layerConfig.offset;

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
