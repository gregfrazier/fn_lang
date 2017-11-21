// fn - disfunctional functional programming language (c) 2017 Greg Frazier
// 135 lines of handwritten js, built to be compact but neither practical nor fast.
// based on Scheme with ideas drawn from http://norvig.com/lispy.html
// MIT License.
let lib = {
    '+': (x, y) => { return x() + y(); }, '-': (x, y) => { return x() - y(); }, '*': (x, y) => { return x() * y(); },
    '/': (x, y) => { return x() / y(); }, 'pow': (x, y) => { return Math.pow(x(), y()); }, 'mod': (x, y) => { return x() % y(); },
    'cond': (_cond, _then, _else) => { return _cond() ? _then() : _else(); }, '=': (x, y) => { return x() === y(); }
}
class $$frame {
    constructor() { this.frame = -1; }
    initRootEnvironment() { return new $$environment(null, this); }
    incFrame() { return ++this.frame; }
}
class $$environment {
    constructor(parent, frameObj) {
        this.nextFrame = frameObj;
        this.id = frameObj.incFrame();
        this.parent = parent;
        this.defs = [];
        this.children = [];
    }
    $$new() {
        let ns = new $$environment(this, this.nextFrame);
        this.children.push(ns)
        return ns;
    }
    addDef(symbol, _eval) {
        if(!this.defs.some((x) => x.symbol == symbol))
            this.defs.push({ $type: 'symbol', $symbol: symbol, $eval: _eval });
    }
    hasDef(symbol) {
        return this.defs.some((x) => x.$symbol === symbol) || (this.parent != null ? this.parent.hasDef(symbol) : null);
    }
    getDef(symbol) {
        return this.defs.find((x) => x.$symbol === symbol) || (this.parent != null ? this.parent.getDef(symbol) : null);
    }
    addProcedure(symbol, params, _eval) {
        if (!this.defs.some((x) => x.symbol == symbol))
            this.defs.push({ $type: 'proc', $symbol: symbol, $eval: _eval, $params: params });
    }
    addValue(symbol, value) {
        if (!this.defs.some((x) => x.symbol == symbol))
            this.defs.push({ $type: 'value', $symbol: symbol, $eval: value });
    }
    addLibrary(symbol) {
        if (!this.defs.some((x) => x.symbol == symbol))
            this.defs.push({ $type: 'library', $symbol: symbol, $eval: lib[symbol] });
    }
}
let environment = new $$frame().initRootEnvironment();
let langDefs = {
	keywords: { regex: [/^LET$/i, /^CONST$/i, /^DEF$/i, /^LAMBDA$/i, /^CURRY$/i, /^IMPORT$/i] },
	tokens: ['KEYWORD', 'WS', 'LITERAL', 'FUNCTION', 'SCOPE_START', 'SCOPE_END'],
	isWhiteSpace: (c, st) => { return st.length === 0 ? /\s/.test(c) : false; },
	isScope: (c) => { return /^(\(|\))$/.test(c); },
	isKeyword: (str) => { return langDefs.keywords.regex.some((c) => c.test(str)); },
	createToken: (token, value) => { return { token: token, value: value }; },
	lexer: (src) => {
        let st = [];
        return Array.from(src).reduce((p, c, a) => {
			let o = p.pop();
			let b = langDefs.isScope(c) ? [o, c, null] : langDefs.isWhiteSpace(c, st) ? [o, null] : (() => { if(c === "'") { st.pop() == undefined ? st.push(0) : 0; } let r = [o, (o != null ? o : '') + c]; o = null; return r; })();
			if (!(o != null)) b.shift();
			p = p.concat(b);
			return p;
		}, []).map((x, i) => {
			if (langDefs.isKeyword(x)) return langDefs.createToken(langDefs.tokens[0], x)
			if (langDefs.isScope(x)) return langDefs.createToken(langDefs.tokens[x.charCodeAt(0) - 36], x)
            return langDefs.createToken(langDefs.tokens[2], x);
		}).filter((x) => (x.value != null));
	},
	parser: (tokens) => {
        let v = tokens.shift();
        if(v.token == 'SCOPE_START') {
            let s = [];
            while(tokens[0].token !== 'SCOPE_END') s.push(langDefs.parser(tokens));
            tokens.shift();
            return s;
        } else if(v.token == "SCOPE_END") {
            console.log('unexpected scope_end');
            return v;
        } else if (v.token == "KEYWORD") {
            return v;
        } else {
            if(isNaN(parseFloat(v.value))) {
                if(/^'[^']*'$/.test(v.value)) v.token = 'STRING';
                else v.token = 'SYMBOL';
            } else { v.token = 'NUMBER'; }
            return v;
        }
    },
    eval: (cscope, env) => {
        let command = cscope instanceof Array ? cscope[0] : cscope;
        if(command.token === 'KEYWORD') {
            if(/(let|const|def)/i.test(command.value)) { // three params always
                let isLambda = ((g) => {
                    if(g instanceof Array) return false;
                    if(g.token === 'KEYWORD' && /(lambda)/i.test(g.value)) return true;
                    return false;
                })(cscope[2]);
                if(!isLambda) env.addDef(cscope[1].value, cscope[2]);
                else env.addProcedure(cscope[1].value, cscope[3], cscope[4]);
            }
            if (/(import)/i.test(command.value)) { // imports a lib function
                cscope.filter((x, i) => { return i != 0; }).forEach((x, i) => {
                    env.addLibrary(x.value);
                });
            }
            return true;
        }
        if(command.token == 'SYMBOL') {
            if(env.hasDef(command.value)) {
                let cmd = env.getDef(command.value);
                if(cmd.$type === 'symbol') return langDefs.eval(cmd.$eval, env);
                if(cmd.$type === 'proc') {
                    let childEnv = env.$$new();
                    cmd.$params.forEach((x, i) => {
                        let value = langDefs.eval(cscope[i+1], env);
                        childEnv.addValue(x.value, value);
                    });
                    let y = langDefs.eval(cmd.$eval, childEnv);
                    return y;
                }
                if(cmd.$type === 'value') return cmd.$eval;
                if(cmd.$type === 'library') {
                    let args = [];
                    cscope.filter((x,i) => { return i != 0; }).forEach((x, i) => {
                        args.push(() => { return langDefs.eval(x, env) });
                    });
                    return cmd.$eval.apply(this, args);
                }
            } else { console.log(`symbol not found - ${command.value}`); }
        }
        if(command.token == 'NUMBER') return parseFloat(command.value);
        if(command.token == 'STRING') return command.value.replace(/'/g,'');
    },
    evalProgram: (ast) => { return ast.reduce((p, c) => { return langDefs.eval(c, environment); }, null); }
}
let testString = `(
    (import + - * / pow mod cond =)
    (def fib lambda(n) (
        cond 
            (= n 0)(0)
            (cond 
                (= n 1)(1)
                (+ (fib (- n 1)) (fib (- n 2)))
            )
        )
    )
    (fib 20)
)`;
console.log(langDefs.evalProgram(langDefs.parser(langDefs.lexer(testString))));