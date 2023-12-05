import { parse, StyleSheet, StyleProp, MediaQueryExp, NestingExp } from './styled';

describe('[@platform-browser/styled]', () => {
  test('parses css correcrly #1', () => {
    const stylesheet = parse(`
      color: red;
      background-color: blue;
    `);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(2);

    const color = stylesheet.body[0] as StyleProp;
    const backgroundColor = stylesheet.body[1] as StyleProp;

    expect(color).toBeInstanceOf(StyleProp);
    expect(color.name).toBe('color');
    expect(color.value).toBe('red');
    expect(backgroundColor).toBeInstanceOf(StyleProp);
    expect(backgroundColor.name).toBe('background-color');
    expect(backgroundColor.value).toBe('blue');
  });

  test('parses css correcrly #2', () => {
    const stylesheet = parse(`
      @media (max-width: 600px) {
        color: red;
        background-color: blue;
      }
    `);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(1);

    const mqe = stylesheet.body[0] as MediaQueryExp;

    expect(mqe).toBeInstanceOf(MediaQueryExp);
    expect(mqe.value).toBe('@media (max-width: 600px)');

    const color = mqe.children[0] as StyleProp;
    const backgroundColor = mqe.children[1] as StyleProp;

    expect(mqe.children.length).toBe(2);
    expect(color).toBeInstanceOf(StyleProp);
    expect(color.name).toBe('color');
    expect(color.value).toBe('red');
    expect(backgroundColor).toBeInstanceOf(StyleProp);
    expect(backgroundColor.name).toBe('background-color');
    expect(backgroundColor.value).toBe('blue');
  });

  test('parses css correcrly #3', () => {
    const stylesheet = parse(`
      &:hover {
        color: red;
        background-color: blue;
      }
    `);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(1);

    const nse = stylesheet.body[0] as NestingExp;

    expect(nse).toBeInstanceOf(NestingExp);
    expect(nse.value).toBe('&:hover');

    const color = nse.children[0] as StyleProp;
    const backgroundColor = nse.children[1] as StyleProp;

    expect(nse.children.length).toBe(2);
    expect(color).toBeInstanceOf(StyleProp);
    expect(color.name).toBe('color');
    expect(color.value).toBe('red');
    expect(backgroundColor).toBeInstanceOf(StyleProp);
    expect(backgroundColor.name).toBe('background-color');
    expect(backgroundColor.value).toBe('blue');
  });

  test('parses css correcrly #4', () => {
    const stylesheet = parse(`
      @media (max-width: 600px) {
        &:hover {
          color: red;
          background-color: blue;
        }
      }
    `);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(1);

    const mqe = stylesheet.body[0] as MediaQueryExp;

    expect(mqe).toBeInstanceOf(MediaQueryExp);
    expect(mqe.value).toBe('@media (max-width: 600px)');

    const nse = mqe.children[0] as NestingExp;

    expect(nse.children.length).toBe(2);
    expect(nse.value).toBe('&:hover');

    const color = nse.children[0] as StyleProp;
    const backgroundColor = nse.children[1] as StyleProp;

    expect(color).toBeInstanceOf(StyleProp);
    expect(color.name).toBe('color');
    expect(color.value).toBe('red');
    expect(backgroundColor).toBeInstanceOf(StyleProp);
    expect(backgroundColor.name).toBe('background-color');
    expect(backgroundColor.value).toBe('blue');
  });

  test('parses css correcrly #5', () => {
    const stylesheet = parse(`
      border: 1px solid black;
      padding: 10px 20px;
      font-size: 16px;
    `);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(3);

    const border = stylesheet.body[0] as StyleProp;
    const padding = stylesheet.body[1] as StyleProp;
    const fontSize = stylesheet.body[2] as StyleProp;

    expect(border).toBeInstanceOf(StyleProp);
    expect(border.name).toBe('border');
    expect(border.value).toBe('1px solid black');
    expect(padding).toBeInstanceOf(StyleProp);
    expect(padding.name).toBe('padding');
    expect(padding.value).toBe('10px 20px');
    expect(fontSize).toBeInstanceOf(StyleProp);
    expect(fontSize.name).toBe('font-size');
    expect(fontSize.value).toBe('16px');
  });

  test('parses css correcrly #5', () => {
    const stylesheet = parse(`
      content: "Hello, world";
      font-family: "Arial", sans-serif;
    `);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(2);

    const content = stylesheet.body[0] as StyleProp;
    const fontFamily = stylesheet.body[1] as StyleProp;

    expect(content).toBeInstanceOf(StyleProp);
    expect(content.name).toBe('content');
    expect(content.value).toBe('"Hello, world"');
    expect(fontFamily).toBeInstanceOf(StyleProp);
    expect(fontFamily.name).toBe('font-family');
    expect(fontFamily.value).toBe('"Arial", sans-serif');
  });

  test('parses css correcrly #6', () => {
    const stylesheet = parse(`
      color : red ;
      background-color : blue ;
    `);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(2);

    const color = stylesheet.body[0] as StyleProp;
    const backgroundColor = stylesheet.body[1] as StyleProp;

    expect(color).toBeInstanceOf(StyleProp);
    expect(color.name).toBe('color');
    expect(color.value).toBe('red');
    expect(backgroundColor).toBeInstanceOf(StyleProp);
    expect(backgroundColor.name).toBe('background-color');
    expect(backgroundColor.value).toBe('blue');
  });

  test('parses css correcrly #7', () => {
    const stylesheet = parse(`
      color
      background-color
    `);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(0);
  });

  test('parses css correcrly #8', () => {
    const stylesheet = parse(``);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(0);
  });

  test('parses css correcrly #9', () => {
    const stylesheet = parse(`
      @media(min-width: 400px) {
        top: 10px;
        left: 20px;

        &:hover {
          color: yellow;
          display: block;
        }

        flex: 1;
      }

      width: 100%;
      height: 100%;
      background-image: url('https://www.xxx.com/cat.jpg');
      font-size: 16px;

      @media(min-width: 700px) {
        top: 100px;
        left: 100px;

        &:hover {
          color: red;
        }

        & div .active {
          color: blue;
          display: flex;
        }
      }

      transition: none;
      transform: translate(10%, 20%, 0) scale(45deg);
    `);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(8);

    {
      const mqe = stylesheet.body[0] as MediaQueryExp;

      expect(mqe).toBeInstanceOf(MediaQueryExp);
      expect(mqe.value).toBe('@media(min-width: 400px)');
      expect(mqe.children.length).toBe(4);

      const top = mqe.children[0] as StyleProp;
      const left = mqe.children[1] as StyleProp;

      expect(top).toBeInstanceOf(StyleProp);
      expect(top.name).toBe('top');
      expect(top.value).toBe('10px');
      expect(left).toBeInstanceOf(StyleProp);
      expect(left.name).toBe('left');
      expect(left.value).toBe('20px');

      {
        const nse = mqe.children[2] as NestingExp;

        expect(nse).toBeInstanceOf(NestingExp);
        expect(nse.value).toBe('&:hover');

        const color = nse.children[0] as StyleProp;
        const display = nse.children[1] as StyleProp;

        expect(color).toBeInstanceOf(StyleProp);
        expect(color.name).toBe('color');
        expect(color.value).toBe('yellow');
        expect(display).toBeInstanceOf(StyleProp);
        expect(display.name).toBe('display');
        expect(display.value).toBe('block');
      }

      const flex = mqe.children[3] as StyleProp;

      expect(flex).toBeInstanceOf(StyleProp);
      expect(flex.name).toBe('flex');
      expect(flex.value).toBe('1');
    }

    {
      const width = stylesheet.body[1] as StyleProp;
      const height = stylesheet.body[2] as StyleProp;
      const backgroundImage = stylesheet.body[3] as StyleProp;
      const fontSize = stylesheet.body[4] as StyleProp;

      expect(width).toBeInstanceOf(StyleProp);
      expect(width.name).toBe('width');
      expect(width.value).toBe('100%');
      expect(height).toBeInstanceOf(StyleProp);
      expect(height.name).toBe('height');
      expect(height.value).toBe('100%');
      expect(backgroundImage).toBeInstanceOf(StyleProp);
      expect(backgroundImage.name).toBe('background-image');
      expect(backgroundImage.value).toBe("url('https://www.xxx.com/cat.jpg')");
      expect(fontSize).toBeInstanceOf(StyleProp);
      expect(fontSize.name).toBe('font-size');
      expect(fontSize.value).toBe('16px');
    }

    {
      const mqe = stylesheet.body[5] as MediaQueryExp;

      expect(mqe).toBeInstanceOf(MediaQueryExp);
      expect(mqe.value).toBe('@media(min-width: 700px)');
      expect(mqe.children.length).toBe(4);

      const top = mqe.children[0] as StyleProp;
      const left = mqe.children[1] as StyleProp;

      expect(top).toBeInstanceOf(StyleProp);
      expect(top.name).toBe('top');
      expect(top.value).toBe('100px');
      expect(left).toBeInstanceOf(StyleProp);
      expect(left.name).toBe('left');
      expect(left.value).toBe('100px');

      {
        const nse = mqe.children[2] as NestingExp;

        expect(nse).toBeInstanceOf(NestingExp);
        expect(nse.value).toBe('&:hover');

        const color = nse.children[0] as StyleProp;

        expect(color).toBeInstanceOf(StyleProp);
        expect(color.name).toBe('color');
        expect(color.value).toBe('red');
      }

      {
        const nse = mqe.children[3] as NestingExp;

        expect(nse).toBeInstanceOf(NestingExp);
        expect(nse.value).toBe('& div .active');

        const color = nse.children[0] as StyleProp;
        const display = nse.children[1] as StyleProp;

        expect(color).toBeInstanceOf(StyleProp);
        expect(color.name).toBe('color');
        expect(color.value).toBe('blue');
        expect(display).toBeInstanceOf(StyleProp);
        expect(display.name).toBe('display');
        expect(display.value).toBe('flex');
      }
    }

    {
      const transition = stylesheet.body[6] as StyleProp;
      const transform = stylesheet.body[7] as StyleProp;

      expect(transition).toBeInstanceOf(StyleProp);
      expect(transition.name).toBe('transition');
      expect(transition.value).toBe('none');
      expect(transform).toBeInstanceOf(StyleProp);
      expect(transform.name).toBe('transform');
      expect(transform.value).toBe('translate(10%, 20%, 0) scale(45deg)');
    }
  });

  test('parses css correcrly #10', () => {
    const stylesheet = parse(`
      & * div.red > .item [selected="true"] #x:hover {
        color: red;
        background-color: blue;
      }
    `);

    expect(stylesheet).toBeInstanceOf(StyleSheet);
    expect(stylesheet.body.length).toBe(1);

    const nse = stylesheet.body[0] as NestingExp;

    expect(nse.children.length).toBe(2);
    expect(nse.value).toBe('& * div.red > .item [selected="true"] #x:hover');

    const color = nse.children[0] as StyleProp;
    const backgroundColor = nse.children[1] as StyleProp;

    expect(color).toBeInstanceOf(StyleProp);
    expect(color.name).toBe('color');
    expect(color.value).toBe('red');
    expect(backgroundColor).toBeInstanceOf(StyleProp);
    expect(backgroundColor.name).toBe('background-color');
    expect(backgroundColor.value).toBe('blue');
  });

  test('throw the error #1', () => {
    const make = () => {
      parse(`
        & div {
          @media (max-width: 500px) {
            color: red;
          }
        }
    `);
    };

    expect(make).toThrowError();
  });

  test('throw the error #2', () => {
    const make = () => {
      parse(`
        ::after {
          color: red;
        }
    `);
    };

    expect(make).toThrowError();
  });

  test('did not throw the error', () => {
    const make = () => {
      parse(`
        &::after {
          color: red;
        }
    `);
    };

    expect(make).not.toThrowError();
  });
});
