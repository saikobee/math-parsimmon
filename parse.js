var P = require("parsimmon");

var __ = P.optWhitespace;

function arrow(n) {
    var s = "";
    while (n-- > 0) {
        s += "~";
    }
    s += "^";
    return s;
}

function first(xs) {
    return xs[0];
}

function rest(xs) {
    return xs.slice(1);
}

function parseNumber(text) {
    return +text;
}

function between(sep, a, b) {
    if (arguments.length === 1) {
        return between.bind(null, sep);
    }
    return a + sep + b;
}

function cons(x, xs) {
    if (arguments.length === 1) {
        return cons.bind(null, x);
    }
    return [x].concat(xs);
}

function concat(a, b) {
    return a.concat(b);
}

function flatten(list) {
    return list.reduce(concat, []);
}

function spaced(p) {
    return __.then(p).skip(__);
}

function word(text) {
    return spaced(P.string(text));
}

function surrounded(l, x, r) {
    return P.string(l).then(x).skip(P.string(r));
}

function BinOp(associativity, p, ops) {
    var pOps = spaced(P.alt.apply(null, ops.map(P.string)));
    var f = reduceBinOps.bind(null, associativity);
    return P.seq(p, P.seq(pOps, p).many()).map(f);
}

function reduceBinOps(associativity, args) {
    var e = first(args);
    var es = flatten(rest(args));
    if (associativity === "right") {
        es.reverse();
    } else if (associativity !== "left") {
        throw new Error("invalid associativity: " + associativity);
    }
    return es.reduce(function(acc, x) {
        return ["BinOp", x[0], acc, x[1]];
    }, e);
}

////// BEGIN GRAMMAR //////

var Expr = P.lazy(function() {
    return spaced(LetExpr.or(BinExpr));
});

var Ident = P.regex(/[a-zA-Z]+/)
    .map(cons("Ident"))
    .desc("Identifier");

var Number = P.regex(/[0-9]+/)
    .map(parseNumber)
    .map(cons("Number"))
    .desc("Number");

var BaseExpr = P.alt(
    Number,
    Ident,
    surrounded("(", Expr, ")")
);

var ExpExpr = BinOp("right", BaseExpr, ["^"]);
var MulExpr = BinOp("left",  ExpExpr,  ["*", "/"]);
var AddExpr = BinOp("left",  MulExpr,  ["+", "-"]);
var BinExpr = AddExpr;

var LetExpr = P.seq(
    word("let").then(Ident),
    word("=").then(Expr),
    word("in").then(Expr)
).map(cons("Let"));

////// END GRAMMAR //////

function parse(text) {
    var result = Expr.parse(text);
    if (!result.status) {
        // TODO: Convert index to actual line and column numbers.
        var lineno = result.index + 1;
        console.error([
            "/your/filesystem/program.txt:" + lineno,
            "",
            "  " + text,
            "  " + arrow(result.index),
            "",
            "parse error: expected " +
            result.expected.reduce(between(", ")),
        ].join("\n"));
        process.exit(1);
    }
    return result.value;
}

module.exports = parse;
