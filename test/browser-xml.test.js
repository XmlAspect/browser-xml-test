import Xml from "@xmlaspect/browser-xml/index.js";
import { expect } from "@open-wc/testing";

const REL = p => new URL(p, import.meta.url).pathname;

const noFileUrl   = REL("./nofile.xml"  )
,     xmlUrl      = REL("./test.xml"    )
,     txtUrl      = REL("./textxml.txt" )
,     xslUrl      = REL("./test.xsl"    )
,CONTENT_TYPE_XML = "application/xml"
,CONTENT_TYPE_XML1 = "text/xml; charset=UTF-8";

describe('browser-xml', () =>
{
  const assert= x=> expect(!!x).to.equal(true);
    it( 'Xml API', function()
    {   assert(Xml              );
        assert(Xml.getXml       );
        assert(Xml.createXml    );
        assert(Xml.transform    );
        assert(Xml.XPath_node   );
        assert(Xml.XPath_nl     );
        assert(Xml.$            );
        assert(Xml.o2xml        );
        assert(Xml.createElement);
        assert(Xml.cleanElement );
    });
    it("Content-Type application/xml for test.xml", function()
    {
        let promise = Xml.getXml(xmlUrl);
        assert( promise.then );
        return promise.then( function( xmlDoc, xhr )
        {   const t = promise.xhr.getResponseHeader("Content-type");
            assert( CONTENT_TYPE_XML === t || CONTENT_TYPE_XML1 === t  );
        });

    });
    it("Content-Type text/plain for testxml.txt", function()
    {   let promise = Xml.getXml(txtUrl);
        assert( promise.then );
        return promise.then( function( xmlDoc, xhr )
        {
            assert( CONTENT_TYPE_XML != promise.xhr.getResponseHeader("Content-type") );
        });
    });
    it('Xml.getXml( 200 )', function()
    {   let promise = Xml.getXml(xmlUrl);
        return promise;
    });
    it('Xml.getXml( 200 ).then.then', function()
    {   let promise = Xml.getXml(xmlUrl);
        return promise
            .then( CHECK_XML() )
            .then( function( xmlDoc )
            {   assert( "root" == xmlDoc.documentElement.nodeName );
            });
    });
    it('Xml.getXml( 404 )', function()
    {   let promise = Xml.getXml(noFileUrl);
        return promise.then(   ERR()
            , function( err )
            {   assert( err.message.indexOf( "404" ) >= 0 );
            });
    });
    it('Xml.getXml( 404 ).then.then', function()
    {   var promise = Xml.getXml(noFileUrl);
        return promise.then( NOP, function(err){ throw err; }).then( ERR()
                , function( err )
                {   assert( err.message.indexOf( "404" ) >= 0 );
                });
    });
    it('Xml.load.then.transform( xml, xsl, el )', function()
    {   var promise = Xml.getXml(xmlUrl);
        return promise.then( function( xmlDoc )
        {
            return Xml.getXml(xslUrl).then( function( xslDoc )
            {
                var el = document.createElement("div");
                Xml.transform( xmlDoc, xslDoc, el );
                assert( el.innerHTML.indexOf("root") > 0 );
            });
        });
    });
    it('Xml.load.then( XPath_nl( leave ) )', function()
    {   var promise = Xml.getXml(xmlUrl);
        return promise.then( function( xmlDoc )
        {   var ret = Xml.XPath_nl("//leave", xmlDoc );
            assert( 2 == ret.length );
            assert( ret[1].nodeName == 'leave' );
        });
    });
    it('Xml.load.then( XPath_node( leave ) )', function()
    {   var promise = Xml.getXml(xmlUrl);
        return promise.then( function( xmlDoc )
        {   var ret = Xml.XPath_node( "//leave", xmlDoc );
            assert( ret.nodeName == 'leave' );
        });
    });

    it('Xml.fromXmlStr( xmlStr )', function()
    {   var xmlDoc = Xml.fromXmlStr("<r><a>A</a></r>");
        var ret = Xml.XPath_node( "//a", xmlDoc );
        assert( ret.nodeName == 'a' );
    });

    it('Xml.nodeText(undefined)', function()
    {   var text = Xml.nodeText(undefined);
        assert( text === undefined );
    });

    it('Xml.nodeText(node)', function()
    {   var xmlDoc = Xml.fromXmlStr("<r><a>A</a></r>");
        var node = Xml.XPath_node( "//a", xmlDoc );
        var text = Xml.nodeText(node);
        assert( text == 'A' );
    });

    const O2X =
        [   {s:'{a:1}'    , t:'<root><a>1</a></root>'}
        ,   {s:'[1,"str"]', t:'<root><r>1</r><r>str</r></root>'}
        ];
    const str2o = e=>( { ...e, o:eval(`(${e.s})` ) } );
    describe('Xml.o2xml', () =>
    {
        [   ...O2X,
        ,   {s:'"str"'    , t:"<root>str</root>"}
        ,   {s:'"<xmlStr"', t:"<root>&lt;xmlStr</root>"}
        ,   {s:'"not xml<"',t:"<root>not xml&lt;</root>"}
        ].map( str2o )
        .map( e=> it( `Xml.o2xml( ${e.s} )`, ()=>
            expect(Xml.toXmlString( Xml.o2xml( e.o ) )).to.equal(e.t)
        ));
    });
    describe('Xml.toXmlString', () =>
    {
        [   ...O2X,
        ,   {s:'"str"'    , t:'<r><![CDATA[str]]></r>'}
        ,   {s:'"<xmlStr"', t:"<xmlStr"}
        ,   {s:'"not xml<"',t:"<r><![CDATA[not xml<]]></r>"}
        ].map( str2o )
        .map( e=> it( `Xml.toXmlString( ${e.s} )`, ()=>
          expect( Xml.toXmlString( e.o )).to.equal(e.t)
        ));

        it( 'Xml.toXmlString( {a:1} )', function()
        {
            var t = Xml.toXmlString( { a: 1 } );
            assert( t === '<root><a>1</a></root>' );
        } );
    });
});

function NOP(a){ return a;}
function CHECK_XML(){ return function( xmlDoc )
{
    if( "root" !== xmlDoc.documentElement.nodeName )
        throw( new Error() );
    return xmlDoc;
} }
function ERR(){ return function()
{   debugger;
    throw( new Error() );
} }
