"use strict";

var JavaScriptMode = require("../javascript").Mode;
var EditSession = require("../../edit_session").EditSession;
var assert = require("../../test/assertions");

module.exports = {

    "test: fold comments": function() {
        var session = new EditSession([
            '/*',
            'stuff',
            '*/'
        ]);
        
        var mode = new JavaScriptMode();
        session.setFoldStyle("markbeginend");
        session.setMode(mode);
        
        assert.equal(session.getFoldWidget(0), "start");
        assert.equal(session.getFoldWidget(1), "");
        assert.equal(session.getFoldWidget(2), "end");
        
        assert.range(session.getFoldWidgetRange(0), 0, 2, 2, 0);
        assert.range(session.getFoldWidgetRange(2), 0, 2, 2, 0);
    },
    
    "test: fold doc style comments": function() {
        var session = new EditSession([
            '/**',
            ' * stuff',
            ' * *** */'
        ]);
        
        var mode = new JavaScriptMode();
        session.setFoldStyle("markbeginend");
        session.setMode(mode);
        
        assert.equal(session.getFoldWidget(0), "start");
        assert.equal(session.getFoldWidget(1), "");
        assert.equal(session.getFoldWidget(2), "end");
        
        assert.range(session.getFoldWidgetRange(0), 0, 3, 2, 7);
        assert.range(session.getFoldWidgetRange(2), 0, 3, 2, 7);
    },
    
    "test: fold sections": function() {
        var session = new EditSession([
            '/*** section0 ***/',
            '{',
            '    /*** section1 ***/',
            '    stuff',
            '       ',
            '    /*** section2 ***/',
            '       ',
            '    stuff',
            '       ',
            '     }',
            'foo'
        ]);
        
        var mode = new JavaScriptMode();
        session.setFoldStyle("markbegin");
        session.setMode(mode);
        
        assert.range(session.getFoldWidgetRange(0, true), 0, 18, 10, 3);
        assert.range(session.getFoldWidgetRange(2, true), 2, 22, 3, 9);
        assert.range(session.getFoldWidgetRange(5, true), 5, 22, 7, 9);
    }
};


if (typeof module !== "undefined" && module === require.main)
    require("asyncjs").test.testcase(module.exports).exec();
