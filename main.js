var util = require("util");
var parse = require("./parse");

var data = [
    "let x = 1 in",
    "let y = 2 in",
    "3 + x * y + 4 + 1 + 2 ^ 3 ^ 2",
].join("\n") + "\n";

// Deeply show data in a compact format.
function show(data) {
    var s = util.inspect(data, {depth: null});
    console.log(s);
}

// Pretend to update an object by connecting prototypes and mutating a new one.
function overlay(obj, k, v) {
    var x = Object.create(obj);
    x[k] = v;
    return x;
}

var opTable = {
    "+": function(a, b) { return a + b; },
    "-": function(a, b) { return a - b; },
    "*": function(a, b) { return a * b; },
    "/": function(a, b) { return a / b; },
    "^": Math.pow,
};

var evaluators = {
    Let: function(scope, name, expr, body) {
        var newScope = overlay(scope, name[1], evaluate(scope, expr));
        return evaluate(newScope, body);
    },
    BinOp: function(scope, op, left, right) {
        return opTable[op](
            evaluate(scope, left),
            evaluate(scope, right)
        );
    },
    Number: function(scope, number) {
        return number;
    },
    Ident: function(scope, ident) {
        if (ident in scope) {
            return scope[ident];
        }
        throw new Error("no such variable: " + ident);
    }
}

function evaluate(scope, data) {
    var tag = data[0];
    var rest = data.slice(1);
    var args = [scope].concat(rest);
    if (evaluators.hasOwnProperty(tag)) {
        return evaluators[tag].apply(null, args);
    }
    throw new Error("oops");
}

var ast = parse(data);
console.log("\n####### AST ###############\n");
show(ast);
console.log("\n####### VALUE #############\n");
show(evaluate({}, ast))
