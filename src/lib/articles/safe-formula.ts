/**
 * Tiny, safe arithmetic evaluator for calculator blocks.
 * Never uses eval/Function: a hand-written recursive-descent parser over
 * numbers, variables, + - * / % ^, parentheses and a whitelist of functions.
 */

const FUNCS: Record<string, (...a: number[]) => number> = {
  min: Math.min,
  max: Math.max,
  round: (x, d = 0) => {
    const f = 10 ** d;
    return Math.round(x * f) / f;
  },
  floor: Math.floor,
  ceil: Math.ceil,
  abs: Math.abs,
  sqrt: Math.sqrt,
  pow: Math.pow,
  log: Math.log,
  exp: Math.exp,
};

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.eE]/.test(src[j])) j++;
      const n = Number(src.slice(i, j));
      if (!Number.isFinite(n)) throw new Error(`Bad number near "${src.slice(i, j)}"`);
      out.push({ t: "num", v: n });
      i = j;
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      out.push({ t: "id", v: src.slice(i, j) });
      i = j;
    } else if ("+-*/%^(),".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
    } else {
      throw new Error(`Unexpected "${c}"`);
    }
  }
  return out;
}

export function evaluateFormula(src: string, vars: Record<string, number>): number {
  if (src.length > 300) throw new Error("Formula too long");
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const take = (v?: string) => {
    const tok = toks[p];
    if (!tok || (v !== undefined && tok.v !== v)) throw new Error(`Expected "${v ?? "value"}"`);
    p++;
    return tok;
  };

  function primary(): number {
    const tok = peek();
    if (!tok) throw new Error("Unexpected end");
    if (tok.t === "num") return (take() as { v: number }).v;
    if (tok.t === "op" && tok.v === "(") {
      take("(");
      const v = expr();
      take(")");
      return v;
    }
    if (tok.t === "op" && (tok.v === "-" || tok.v === "+")) {
      take();
      const v = power();
      return tok.v === "-" ? -v : v;
    }
    if (tok.t === "id") {
      take();
      const next = peek();
      if (next?.t === "op" && next.v === "(") {
        // Own properties only: "constructor", "__proto__" etc. must never resolve.
        const fn = Object.hasOwn(FUNCS, tok.v) ? FUNCS[tok.v] : undefined;
        if (!fn) throw new Error(`Unknown function "${tok.v}"`);
        take("(");
        const args: number[] = [];
        if (!(peek()?.t === "op" && peek()?.v === ")")) {
          args.push(expr());
          while (peek()?.t === "op" && peek()?.v === ",") {
            take(",");
            args.push(expr());
          }
        }
        take(")");
        return fn(...args);
      }
      if (!Object.hasOwn(vars, tok.v) || typeof vars[tok.v] !== "number") throw new Error(`Unknown input "${tok.v}"`);
      return vars[tok.v];
    }
    throw new Error(`Unexpected "${tok.v}"`);
  }
  function power(): number {
    const base = primary();
    if (peek()?.t === "op" && peek()?.v === "^") {
      take("^");
      return base ** power();
    }
    return base;
  }
  function term(): number {
    let v = power();
    while (peek()?.t === "op" && "*/%".includes(String(peek()?.v))) {
      const op = take().v;
      const r = power();
      v = op === "*" ? v * r : op === "/" ? v / r : v % r;
    }
    return v;
  }
  function expr(): number {
    let v = term();
    while (peek()?.t === "op" && "+-".includes(String(peek()?.v))) {
      const op = take().v;
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  const result = expr();
  if (p !== toks.length) throw new Error(`Unexpected "${toks[p].v}"`);
  return result;
}
