window.registerExtraLanguages = monaco => {
    const add = (id, aliases, extensions, config, tokens) => {
        if (monaco.languages.getLanguages().some(l => l.id === id)) return;
        monaco.languages.register({
            id: id,
            aliases: aliases,
            extensions: extensions
        });
        monaco.languages.setLanguageConfiguration(id, config);
        monaco.languages.setMonarchTokensProvider(id, tokens);
    };
    const brackets = [ [ "{", "}" ], [ "[", "]" ], [ "(", ")" ] ];
    const pairs = [ {
        open: "{",
        close: "}"
    }, {
        open: "[",
        close: "]"
    }, {
        open: "(",
        close: ")"
    }, {
        open: '"',
        close: '"',
        notIn: [ "string" ]
    }, {
        open: "'",
        close: "'",
        notIn: [ "string" ]
    } ];
    add("luau", [ "Luau", "luau" ], [ ".luau" ], {
        comments: {
            lineComment: "--",
            blockComment: [ "--[[", "]]" ]
        },
        brackets: brackets,
        autoClosingPairs: [ ...pairs, {
            open: "`",
            close: "`",
            notIn: [ "string" ]
        } ],
        surroundingPairs: pairs,
        indentationRules: {
            increaseIndentPattern: /^\s*((\b(else|function|then|do|repeat)\b((?!\b(end|until)\b).)*)|(\{\s*))$/,
            decreaseIndentPattern: /^\s*((\b(elseif|else|end|until)\b)|(\})|(\)))/
        }
    }, {
        defaultToken: "",
        keywords: [ "and", "break", "do", "else", "elseif", "end", "false", "for", "function", "if", "in", "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while", "continue", "export", "type", "typeof" ],
        builtins: [ "game", "workspace", "script", "Instance", "Vector3", "Vector2", "CFrame", "Color3", "UDim2", "UDim", "Enum", "task", "wait", "print", "warn", "error", "pairs", "ipairs", "require", "tostring", "tonumber", "typeof", "setmetatable", "getmetatable", "string", "table", "math", "coroutine", "os", "debug", "buffer", "bit32", "utf8", "select", "pcall", "xpcall", "assert", "next", "unpack", "rawget", "rawset", "rawequal" ],
        typeKeywords: [ "number", "string", "boolean", "any", "never", "unknown", "thread", "userdata", "buffer", "vector" ],
        operators: [ "+", "-", "*", "/", "//", "%", "^", "#", "==", "~=", "<=", ">=", "<", ">", "=", "+=", "-=", "*=", "/=", "//=", "%=", "^=", "..=", "..", "...", "->", "::", "?" ],
        symbols: /[=><!~?:&|+\-*\/\^%#.]+/,
        escapes: /\\(?:[abfnrtvz\\"'`\n{}]|x[0-9A-Fa-f]{2}|u\{[0-9A-Fa-f]+\}|\d{1,3})/,
        tokenizer: {
            root: [ [ /(type)(\s+)([A-Za-z_]\w*)/, [ "keyword", "", "type.identifier" ] ], [ /[a-zA-Z_]\w*(?=\s*\()/, {
                cases: {
                    "@keywords": "keyword",
                    "@builtins": "predefined",
                    "@default": "function"
                }
            } ], [ /[a-zA-Z_]\w*/, {
                cases: {
                    "@keywords": "keyword",
                    "@typeKeywords": "type",
                    "@builtins": "predefined",
                    "@default": "identifier"
                }
            } ], {
                include: "@whitespace"
            }, [ /(::)(\s*)([A-Za-z_]\w*)/, [ "delimiter", "", "type.identifier" ] ], [ /[{}()\[\]]/, "@brackets" ], [ /@symbols/, {
                cases: {
                    "@operators": "delimiter",
                    "@default": ""
                }
            } ], [ /0[xX][0-9a-fA-F_]+/, "number.hex" ], [ /0[bB][01_]+/, "number.binary" ], [ /\d[\d_]*(\.\d+)?([eE][\-+]?\d+)?/, "number" ], [ /[;,.]/, "delimiter" ], [ /\[(=*)\[/, {
                token: "string",
                next: "@longstring.$1"
            } ], [ /"/, {
                token: "string.quote",
                next: '@string."'
            } ], [ /'/, {
                token: "string.quote",
                next: "@string.'"
            } ], [ /`/, {
                token: "string.quote",
                next: "@interp"
            } ] ],
            whitespace: [ [ /[ \t\r\n]+/, "" ], [ /--\[(=*)\[/, {
                token: "comment",
                next: "@longcomment.$1"
            } ], [ /--.*$/, "comment" ] ],
            longcomment: [ [ /\](=*)\]/, {
                cases: {
                    "$1==$S2": {
                        token: "comment",
                        next: "@pop"
                    },
                    "@default": "comment"
                }
            } ], [ /./, "comment" ] ],
            longstring: [ [ /\](=*)\]/, {
                cases: {
                    "$1==$S2": {
                        token: "string",
                        next: "@pop"
                    },
                    "@default": "string"
                }
            } ], [ /./, "string" ] ],
            string: [ [ /[^\\"']+/, "string" ], [ /@escapes/, "string.escape" ], [ /\\./, "string.escape.invalid" ], [ /["']/, {
                cases: {
                    "$#==$S2": {
                        token: "string.quote",
                        next: "@pop"
                    },
                    "@default": "string"
                }
            } ] ],
            interp: [ [ /\{/, {
                token: "delimiter.bracket",
                next: "@interpExpr"
            } ], [ /[^`{\\]+/, "string" ], [ /@escapes/, "string.escape" ], [ /`/, {
                token: "string.quote",
                next: "@pop"
            } ] ],
            interpExpr: [ [ /\}/, {
                token: "delimiter.bracket",
                next: "@pop"
            } ], {
                include: "root"
            } ]
        }
    });
    add("toml", [ "TOML", "toml" ], [ ".toml" ], {
        comments: {
            lineComment: "#"
        },
        brackets: [ [ "[", "]" ], [ "{", "}" ] ],
        autoClosingPairs: pairs,
        surroundingPairs: pairs
    }, {
        tokenizer: {
            root: [ [ /^\s*\[\[[^\]]*\]\]/, "type.identifier" ], [ /^\s*\[[^\]]*\]/, "type.identifier" ], [ /#.*$/, "comment" ], [ /("""|''')/, {
                token: "string",
                next: "@multi.$1"
            } ], [ /"([^"\\]|\\.)*"/, "string" ], [ /'[^']*'/, "string" ], [ /\b(true|false|inf|nan)\b/, "keyword" ], [ /\d{4}-\d{2}-\d{2}([Tt ]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})?)?/, "number" ], [ /[+-]?(0x[0-9a-fA-F_]+|0o[0-7_]+|0b[01_]+|\d[\d_]*(\.\d[\d_]*)?([eE][+-]?\d+)?)/, "number" ], [ /[A-Za-z0-9_\-.]+(?=\s*=)/, "variable" ], [ /[=,.]/, "delimiter" ], [ /[{}\[\]]/, "@brackets" ] ],
            multi: [ [ /("""|''')/, {
                cases: {
                    "$1==$S2": {
                        token: "string",
                        next: "@pop"
                    },
                    "@default": "string"
                }
            } ], [ /./, "string" ] ]
        }
    });
    add("zig", [ "Zig", "zig" ], [ ".zig" ], {
        comments: {
            lineComment: "//"
        },
        brackets: brackets,
        autoClosingPairs: pairs,
        surroundingPairs: pairs
    }, {
        keywords: [ "addrspace", "align", "allowzero", "and", "anyframe", "anytype", "asm", "async", "await", "break", "callconv", "catch", "comptime", "const", "continue", "defer", "else", "enum", "errdefer", "error", "export", "extern", "fn", "for", "if", "inline", "noalias", "noinline", "nosuspend", "opaque", "or", "orelse", "packed", "pub", "resume", "return", "linksection", "struct", "suspend", "switch", "test", "threadlocal", "try", "union", "unreachable", "usingnamespace", "var", "volatile", "while", "true", "false", "null", "undefined" ],
        types: [ "i8", "u8", "i16", "u16", "i32", "u32", "i64", "u64", "i128", "u128", "isize", "usize", "f16", "f32", "f64", "f128", "bool", "void", "noreturn", "type", "anyerror", "comptime_int", "comptime_float" ],
        tokenizer: {
            root: [ [ /@[a-zA-Z_]\w*/, "predefined" ], [ /[a-zA-Z_]\w*/, {
                cases: {
                    "@keywords": "keyword",
                    "@types": "type",
                    "@default": "identifier"
                }
            } ], [ /\/\/.*$/, "comment" ], [ /"([^"\\]|\\.)*"/, "string" ], [ /'([^'\\]|\\.)'/, "string" ], [ /\\\\.*$/, "string" ], [ /\d[\d_]*(\.\d+)?/, "number" ], [ /[{}()\[\]]/, "@brackets" ] ]
        }
    });
    add("nim", [ "Nim", "nim" ], [ ".nim", ".nims" ], {
        comments: {
            lineComment: "#",
            blockComment: [ "#[", "]#" ]
        },
        brackets: brackets,
        autoClosingPairs: pairs,
        surroundingPairs: pairs
    }, {
        keywords: [ "addr", "and", "as", "asm", "bind", "block", "break", "case", "cast", "concept", "const", "continue", "converter", "defer", "discard", "distinct", "div", "do", "elif", "else", "end", "enum", "except", "export", "finally", "for", "from", "func", "if", "import", "in", "include", "interface", "is", "isnot", "iterator", "let", "macro", "method", "mixin", "mod", "nil", "not", "notin", "object", "of", "or", "out", "proc", "ptr", "raise", "ref", "return", "shl", "shr", "static", "template", "try", "tuple", "type", "using", "var", "when", "while", "xor", "yield", "true", "false" ],
        tokenizer: {
            root: [ [ /[a-zA-Z_]\w*/, {
                cases: {
                    "@keywords": "keyword",
                    "@default": "identifier"
                }
            } ], [ /#\[/, {
                token: "comment",
                next: "@comment"
            } ], [ /#.*$/, "comment" ], [ /"""/, {
                token: "string",
                next: "@triple"
            } ], [ /"([^"\\]|\\.)*"/, "string" ], [ /'([^'\\]|\\.)'/, "string" ], [ /\d[\d_]*(\.\d+)?/, "number" ], [ /[{}()\[\]]/, "@brackets" ] ],
            comment: [ [ /\]#/, {
                token: "comment",
                next: "@pop"
            } ], [ /./, "comment" ] ],
            triple: [ [ /"""/, {
                token: "string",
                next: "@pop"
            } ], [ /./, "string" ] ]
        }
    });
};