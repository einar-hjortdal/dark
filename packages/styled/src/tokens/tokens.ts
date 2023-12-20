import {
  OPENING_CURLY_BRACE_MARK,
  CLOSING_CURLY_BRACE_MARK,
  COLON_MARK,
  SEMICOLON_MARK,
  MEDIA_QUERY_MARK,
  CONTAINER_QUERY_MARK,
  KEYFRAMES_MARK,
  NESTING_MARK,
  SELF_MARK,
  DOT_MARK,
  FUNCTION_MARK,
  BLANK_SPACE,
} from '../constants';

import { detectIsKeyframes } from '../keyframes';

abstract class Token {
  name = '';
  value = '';
  parent: Parent;
  isDynamic = false;

  normalize() {
    this.name = this.name.trim();
    this.value = this.value.trim();
  }

  markAsDynamic() {
    this.isDynamic = true;
    detectIsToken(this.parent) && !this.parent.isDynamic && this.parent.markAsDynamic();
  }

  abstract generate(): string | Tuple;
  abstract generate(props: object, args: Array<Function>): string | Tuple;
  abstract generate(className: string | null, props: object, args: Array<Function>): string | Tuple;
}

class StyleExp extends Token {
  override generate(): string {
    return `${this.name}${COLON_MARK}${this.value}${SEMICOLON_MARK}`;
  }
}

class NestingExp<P extends object = {}> extends Token {
  name = NESTING_MARK;
  children: Children = [];

  override generate(...args: Array<unknown>): string {
    const className = args[0] as string | null;
    const props = args[1] as P;
    const fns = args[2] as Array<Function>;
    let styles = `${this.value.replaceAll(SELF_MARK, `${DOT_MARK}${className}`)}${OPENING_CURLY_BRACE_MARK}`;
    let keyframes = '';

    for (const token of this.children) {
      const [$styles, _, __, ___, $keyframes] = generate({ token, className, props, fns });

      styles += $styles;
      keyframes += $keyframes;
    }

    styles += `${CLOSING_CURLY_BRACE_MARK}${keyframes}`;

    return styles;
  }
}

class MediaQueryExp<P extends object = {}> extends Token {
  name = MEDIA_QUERY_MARK;
  children: Children = [];

  override generate(...args: Array<unknown>): string {
    const className = args[0] as string | null;
    const props = args[1] as P;
    const fns = args[2] as Array<Function>;
    let styles = className
      ? `${this.value}${OPENING_CURLY_BRACE_MARK}${DOT_MARK}${className}${OPENING_CURLY_BRACE_MARK}`
      : `${this.value}${OPENING_CURLY_BRACE_MARK}`;
    let nesting = '';

    for (const token of this.children) {
      const [$styles, $nesting] = generate({ token, className, props, fns });

      styles += $styles;
      nesting += $nesting;
    }

    if (className) {
      styles += `${CLOSING_CURLY_BRACE_MARK}${nesting}${CLOSING_CURLY_BRACE_MARK}`;
    } else {
      styles += `${nesting}${CLOSING_CURLY_BRACE_MARK}`;
    }

    return styles;
  }
}

class ContainerQueryExp<P extends object = {}> extends Token {
  name = CONTAINER_QUERY_MARK;
  children: Children = [];

  override generate(...args: Array<unknown>): string {
    const className = args[0] as string | null;
    const props = args[1] as P;
    const fns = args[2] as Array<Function>;
    let styles = className
      ? `${this.value}${OPENING_CURLY_BRACE_MARK}${DOT_MARK}${className}${OPENING_CURLY_BRACE_MARK}`
      : `${this.value}${OPENING_CURLY_BRACE_MARK}`;
    let nesting = '';

    for (const token of this.children) {
      const [$styles, $nesting] = generate({ token, className, props, fns });

      styles += $styles;
      nesting += $nesting;
    }

    if (className) {
      styles += `${CLOSING_CURLY_BRACE_MARK}${nesting}${CLOSING_CURLY_BRACE_MARK}`;
    } else {
      styles += `${nesting}${CLOSING_CURLY_BRACE_MARK}`;
    }

    return styles;
  }
}

class KeyframesExp<P extends object = {}> extends Token {
  name = KEYFRAMES_MARK;
  children: Children = [];

  override generate(...args: Array<unknown>): string {
    const props = args[0] as P;
    const fns = args[1] as Array<Function>;
    let keyframes = `${this.value}${OPENING_CURLY_BRACE_MARK}`;

    for (const token of this.children) {
      const [$styles, $nesting] = generate({ token, props, fns });

      keyframes += $styles;
      keyframes += $nesting;
    }

    keyframes += `${CLOSING_CURLY_BRACE_MARK}`;

    return keyframes;
  }
}

class FunctionExp<P extends object = {}> extends Token {
  name = FUNCTION_MARK;
  args: Array<number> = [];
  style: StyleExp = null;
  private end = '';
  private isSealed = false;

  add(idx: number) {
    this.args.push(idx);
  }

  seal(end: string) {
    this.isSealed = true;
    this.end = end;
  }

  getIsSealed() {
    return this.isSealed;
  }

  generate(...args: Array<unknown>): Tuple {
    const className = args[0] as string | null;
    const props = args[1] as P;
    const fns = args[2] as Array<Function>;
    const styleExp = this.style;
    const [idx, ...rest] = this.args;
    const value = fns[idx](props);
    let styles = '';
    let nesting = '';
    let media = '';
    let container = '';
    let keyframes = '';

    if (detectIsStyleSheet(value)) {
      for (const token of value.children) {
        const [$styles, $nesting, $media, $container, $keyframes] = generate({ token, className, props, fns });

        styles += $styles;
        nesting += $nesting;
        media += $media;
        container += $container;
        keyframes += $keyframes;
      }
    } else if (styleExp) {
      const end = rest.reduce((acc, x) => (acc += BLANK_SPACE + fns[x](props)), '') + this.end;

      if (detectIsKeyframes(value)) {
        styleExp.value = replace(this.name, value.getName()) + end;
        styles += styleExp.generate();
        keyframes += value.getToken().generate(props, fns);
      } else {
        styleExp.value = replace(this.name, value) + end;
        styles += styleExp.generate();
      }
    }

    return [styles, nesting, media, container, keyframes];
  }
}

type GenerateOptions<P extends object> = {
  className?: string;
  props?: P;
  fns?: Array<Function>;
};

class StyleSheet<P extends object = {}> {
  children: Children = [];

  generate(options: GenerateOptions<P>) {
    const { className = null, props, fns } = options;
    let styles = className ? `${DOT_MARK}${className}${OPENING_CURLY_BRACE_MARK}` : '';
    let nesting = '';
    let media = '';
    let container = '';
    let keyframes = '';

    for (const token of this.children) {
      const [$styles, $nesting, $media, $container, $keyframes] = generate({ token, className, props, fns });

      styles += $styles;
      nesting += $nesting;
      media += $media;
      container += $container;
      keyframes += $keyframes;
    }

    if (className) {
      styles += `${CLOSING_CURLY_BRACE_MARK}${nesting}${media}${container}${keyframes}`;
    } else {
      styles += `${nesting}${media}${container}${keyframes}`;
    }

    return styles;
  }
}

type GenerateProps<P extends object> = {
  token: Token;
  className?: string | null;
  props?: P;
  fns?: Array<Function>;
};

function generate<P extends object = {}>(options: GenerateProps<P>): Tuple {
  const { token, className = null, props, fns } = options;
  let styles = '';
  let nesting = '';
  let media = '';
  let container = '';
  let keyframes = '';

  if (detectIsStyleExp(token)) {
    styles += token.generate();
  } else if (detectIsNestingExp(token)) {
    nesting += token.generate(className, props, fns);
  } else if (detectIsMediaQueryExp(token)) {
    media += token.generate(className, props, fns);
  } else if (detectIsContainerQueryExp(token)) {
    container += token.generate(className, props, fns);
  } else if (detectIsKeyframesExp(token)) {
    keyframes += token.generate(props, fns);
  } else if (detectIsFunctionExp(token)) {
    const [$styles, $nesting, $media, $container, $keyframes] = token.generate(className, props, fns);

    styles += $styles;
    nesting += $nesting;
    media += $media;
    container += $container;
    keyframes += $keyframes;
  }

  return [styles, nesting, media, container, keyframes];
}

type Tuple = [string, string, string, string, string];

export type Parent = StyleSheet | Token;

export type Children = Array<Token>;

const detectIsToken = (x: unknown): x is Token => x instanceof Token;

const detectIsStyleExp = (x: unknown): x is StyleExp => x instanceof StyleExp;

const detectIsMediaQueryExp = (x: unknown): x is MediaQueryExp => x instanceof MediaQueryExp;

const detectIsContainerQueryExp = (x: unknown): x is ContainerQueryExp => x instanceof ContainerQueryExp;

const detectIsKeyframesExp = (x: unknown): x is KeyframesExp => x instanceof KeyframesExp;

const detectIsNestingExp = (x: unknown): x is NestingExp => x instanceof NestingExp;

const detectIsFunctionExp = (x: unknown): x is FunctionExp => x instanceof FunctionExp;

const detectIsStyleSheet = (x: unknown): x is StyleSheet => x instanceof StyleSheet;

const replace = (target: string, x: string) => target.replace(FUNCTION_MARK, x);

export {
  StyleSheet,
  StyleExp,
  MediaQueryExp,
  ContainerQueryExp,
  KeyframesExp,
  NestingExp,
  FunctionExp,
  detectIsStyleSheet,
  detectIsStyleExp,
  detectIsMediaQueryExp,
  detectIsContainerQueryExp,
  detectIsKeyframesExp,
  detectIsNestingExp,
  detectIsFunctionExp,
};
