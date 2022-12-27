/** @jsx h */
import { Routes } from './types';
import { createRoutes, renderRoot } from './create-routes';

describe('[router/create-routes]', () => {
  test('can match simple routes correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second',
        render: () => null,
      },
      {
        path: 'third',
        render: () => null,
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/first', routes$).matched.cursor.fullPath).toBe('/first/');
    expect(renderRoot('/first/', routes$).matched.cursor.fullPath).toBe('/first/');
    expect(renderRoot('/second', routes$).matched.cursor.fullPath).toBe('/second/');
    expect(renderRoot('/second/', routes$).matched.cursor.fullPath).toBe('/second/');
    expect(renderRoot('/third', routes$).matched.cursor.fullPath).toBe('/third/');
    expect(renderRoot('/third/', routes$).matched.cursor.fullPath).toBe('/third/');
  });

  test('can match incorrect routes correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second',
        render: () => null,
      },
      {
        path: 'third',
        render: () => null,
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/', routes$).matched).toBe(null);
    expect(renderRoot('', routes$).matched).toBe(null);
    expect(renderRoot('/xxx', routes$).matched).toBe(null);
    expect(renderRoot('/second1', routes$).matched).toBe(null);
    expect(renderRoot('/second/1', routes$).matched.cursor.fullPath).toBe('/second/');
    expect(renderRoot('/first/1/xxx', routes$).matched.cursor.fullPath).toBe('/first/');
    expect(renderRoot('/some/broken/url', routes$).matched).toBe(null);
  });

  test('can match nested routes correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second',
        render: () => null,
        children: [
          {
            path: 'a',
            render: () => null,
          },
          {
            path: 'b',
            render: () => null,
          },
        ],
      },
      {
        path: 'third',
        render: () => null,
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/first', routes$).matched.cursor.fullPath).toBe('/first/');
    expect(renderRoot('/second', routes$).matched.cursor.fullPath).toBe('/second/');
    expect(renderRoot('/second/a', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/second/b', routes$).matched.cursor.fullPath).toBe('/second/b/');
    expect(renderRoot('/second/b/some/broken/route', routes$).matched.cursor.fullPath).toBe('/second/b/');
    expect(renderRoot('/third', routes$).matched.cursor.fullPath).toBe('/third/');
  });

  test('can match deeply nested routes correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second',
        render: () => null,
        children: [
          {
            path: 'a',
            render: () => null,
            children: [
              {
                path: '1',
                render: () => null,
              },
              {
                path: '2',
                render: () => null,
              },
            ],
          },
          {
            path: 'b',
            render: () => null,
            children: [
              {
                path: '1',
                render: () => null,
              },
              {
                path: '2',
                render: () => null,
              },
            ],
          },
        ],
      },
      {
        path: 'third',
        render: () => null,
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/first', routes$).matched.cursor.fullPath).toBe('/first/');
    expect(renderRoot('/second', routes$).matched.cursor.fullPath).toBe('/second/');
    expect(renderRoot('/third', routes$).matched.cursor.fullPath).toBe('/third/');
    expect(renderRoot('/second/a', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/second/a/1', routes$).matched.cursor.fullPath).toBe('/second/a/1/');
    expect(renderRoot('/second/a/2', routes$).matched.cursor.fullPath).toBe('/second/a/2/');
    expect(renderRoot('/second/b', routes$).matched.cursor.fullPath).toBe('/second/b/');
    expect(renderRoot('/second/b/1', routes$).matched.cursor.fullPath).toBe('/second/b/1/');
    expect(renderRoot('/second/b/2', routes$).matched.cursor.fullPath).toBe('/second/b/2/');
  });

  test('can work with redirects correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        redirectTo: 'second',
      },
      {
        path: 'second',
        render: () => null,
      },
      {
        path: 'third',
        render: () => null,
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/first', routes$).matched.cursor.fullPath).toBe('/second/');
    expect(renderRoot('/second', routes$).matched.cursor.fullPath).toBe('/second/');
    expect(renderRoot('/third', routes$).matched.cursor.fullPath).toBe('/third/');
  });

  test('can work with chained redirects correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        redirectTo: 'second',
      },
      {
        path: 'second',
        redirectTo: 'third',
      },
      {
        path: 'third',
        redirectTo: 'fourth',
      },
      {
        path: 'fourth',
        render: () => null,
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/first', routes$).matched.cursor.fullPath).toBe('/fourth/');
    expect(renderRoot('/second', routes$).matched.cursor.fullPath).toBe('/fourth/');
    expect(renderRoot('/third', routes$).matched.cursor.fullPath).toBe('/fourth/');
    expect(renderRoot('/fourth', routes$).matched.cursor.fullPath).toBe('/fourth/');
  });

  test('can work with redirects in nested routes correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        redirectTo: 'second',
      },
      {
        path: 'second',
        render: () => null,
        children: [
          {
            path: 'a',
            redirectTo: 'b',
          },
          {
            path: 'b',
            redirectTo: 'c',
          },
          {
            path: 'c',
            render: () => null,
          },
        ],
      },
      {
        path: 'third',
        redirectTo: 'fourth',
      },
      {
        path: 'fourth',
        render: () => null,
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/second/a', routes$).matched.cursor.fullPath).toBe('/second/c/');
    expect(renderRoot('/second/b', routes$).matched.cursor.fullPath).toBe('/second/c/');
    expect(renderRoot('/second/c', routes$).matched.cursor.fullPath).toBe('/second/c/');
  });

  test('can work with root redirect correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: '',
        redirectTo: 'first',
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/', routes$).matched.cursor.fullPath).toBe('/first/');
  });

  test('can work with root redirect with full path strategy correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: '/',
        redirectTo: '/first',
        pathMatch: 'full',
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/', routes$).matched.cursor.fullPath).toBe('/first/');
  });

  test('can combine match strategies correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second',
        render: () => null,
        children: [
          {
            path: '/second/a',
            redirectTo: '/second/b',
            pathMatch: 'full',
          },
          {
            path: 'b',
            render: () => null,
          },
        ],
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/second/a', routes$).matched.cursor.fullPath).toBe('/second/b/');
  });

  test('can work with wildcard routes correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second',
        render: () => null,
        children: [
          {
            path: 'a',
            render: () => null,
          },
          {
            path: 'b',
            render: () => null,
          },
        ],
      },
      {
        path: '',
        redirectTo: 'first',
      },
      {
        path: '**',
        render: () => null,
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/', routes$).matched.cursor.fullPath).toBe('/first/');
    expect(renderRoot('/second/a', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/broken/url', routes$).matched.cursor.fullPath).toBe('/**/');
  });

  test('can work with wildcard in nested routes correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second',
        render: () => null,
        children: [
          {
            path: 'a',
            render: () => null,
          },
          {
            path: 'b',
            render: () => null,
          },
          {
            path: '**',
            render: () => null,
          },
        ],
      },
      {
        path: '',
        redirectTo: 'first',
      },
      {
        path: '**',
        render: () => null,
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/second/a', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/second/broken/url', routes$).matched.cursor.fullPath).toBe('/second/**/');
    expect(renderRoot('/second/a/broken/url', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/broken/url', routes$).matched.cursor.fullPath).toBe('/**/');
  });

  test('can combine wildcard routes and redirects in nested routes correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second',
        render: () => null,
        children: [
          {
            path: 'a',
            render: () => null,
          },
          {
            path: 'b',
            render: () => null,
          },
          {
            path: '**',
            redirectTo: 'a',
          },
        ],
      },
      {
        path: '**',
        redirectTo: 'first',
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/second/a', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/second/broken/url', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/second/a/broken/url', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/broken/url', routes$).matched.cursor.fullPath).toBe('/first/');
  });

  test('can combine wildcard routes and redirects in deeply nested routes correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second',
        render: () => null,
        children: [
          {
            path: 'a',
            render: () => null,
          },
          {
            path: 'b',
            render: () => null,
            children: [
              {
                path: '1',
                render: () => null,
              },
              {
                path: '2',
                render: () => null,
              },
              {
                path: '**',
                redirectTo: '1',
              },
            ],
          },
          {
            path: '**',
            redirectTo: 'a',
          },
        ],
      },
      {
        path: '**',
        redirectTo: 'first',
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/second/a', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/second/broken/url', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/second/a/broken/url', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/second/b/broken/url', routes$).matched.cursor.fullPath).toBe('/second/b/1/');
    expect(renderRoot('/second/b', routes$).matched.cursor.fullPath).toBe('/second/b/1/');
    expect(renderRoot('/second/b/', routes$).matched.cursor.fullPath).toBe('/second/b/1/');
    expect(renderRoot('/second/b/1', routes$).matched.cursor.fullPath).toBe('/second/b/1/');
    expect(renderRoot('/second/b/1/', routes$).matched.cursor.fullPath).toBe('/second/b/1/');
    expect(renderRoot('/second/b/1/broken/url', routes$).matched.cursor.fullPath).toBe('/second/b/1/');
    expect(renderRoot('/second/b/2/broken/url', routes$).matched.cursor.fullPath).toBe('/second/b/2/');
    expect(renderRoot('/broken/url', routes$).matched.cursor.fullPath).toBe('/first/');
  });

  test('can work with parameters correctly', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second/:id',
        render: () => null,
        children: [
          {
            path: 'a',
            render: () => null,
          },
          {
            path: 'b/:id',
            render: () => null,
          },
        ],
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/second/1/a', routes$).matched.cursor.fullPath).toBe('/second/:id/a/');
    expect(renderRoot('/second/2/a', routes$).matched.cursor.fullPath).toBe('/second/:id/a/');
    expect(renderRoot('/second/1/b/2', routes$).matched.cursor.fullPath).toBe('/second/:id/b/:id/');
    expect(renderRoot('/second/100/b/2000', routes$).matched.cursor.fullPath).toBe('/second/:id/b/:id/');
  });

  test('throws error when illegal redirect occurs in nested components', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second',
        render: () => null,
        children: [
          {
            path: 'child-a',
            render: () => null,
            children: [
              {
                path: '/second/child-a/1',
                redirectTo: '/first',
                pathMatch: 'full',
              },
              {
                path: '2',
                render: () => null,
              },
            ],
          },
          {
            path: 'child-b',
            render: () => null,
          },
        ],
      },
      {
        path: 'third',
        render: () => null,
      },
      {
        path: '**',
        redirectTo: 'first',
      },
    ];
    const routes$ = createRoutes(routes);

    expect(() => renderRoot('/second/child-a/1/', routes$)).toThrowError();
  });

  test('can work with flatten tree routes', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second/a/1',
        render: () => null,
      },
      {
        path: 'second/a/2',
        render: () => null,
      },
      {
        path: 'second/a',
        render: () => null,
      },
      {
        path: 'second/b',
        redirectTo: 'third',
      },
      {
        path: 'second',
        render: () => null,
      },
      {
        path: 'third',
        render: () => null,
      },
      {
        path: '**',
        redirectTo: 'first',
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/', routes$).matched.cursor.fullPath).toBe('/first/');
    expect(renderRoot('/first', routes$).matched.cursor.fullPath).toBe('/first/');
    expect(renderRoot('/second', routes$).matched.cursor.fullPath).toBe('/second/');
    expect(renderRoot('/second/a', routes$).matched.cursor.fullPath).toBe('/second/a/');
    expect(renderRoot('/second/a/1', routes$).matched.cursor.fullPath).toBe('/second/a/1/');
    expect(renderRoot('/second/a/2', routes$).matched.cursor.fullPath).toBe('/second/a/2/');
    expect(renderRoot('/second/b', routes$).matched.cursor.fullPath).toBe('/third/');
    expect(renderRoot('/third/', routes$).matched.cursor.fullPath).toBe('/third/');
  });

  test('can work with combined tree strategies', () => {
    const routes: Routes = [
      {
        path: 'first',
        render: () => null,
      },
      {
        path: 'second/a',
        render: () => null,
        children: [
          {
            path: '1',
            render: () => null,
          },
          {
            path: '2',
            render: () => null,
          },
          {
            path: '**',
            redirectTo: '2',
          },
        ],
      },
      {
        path: 'second/b',
        redirectTo: 'third',
      },
      {
        path: 'second',
        render: () => null,
      },
      {
        path: 'third',
        render: () => null,
      },
      {
        path: '**',
        redirectTo: 'first',
      },
    ];
    const routes$ = createRoutes(routes);

    expect(renderRoot('/', routes$).matched.cursor.fullPath).toBe('/first/');
    expect(renderRoot('/first', routes$).matched.cursor.fullPath).toBe('/first/');
    expect(renderRoot('/second', routes$).matched.cursor.fullPath).toBe('/second/');
    expect(renderRoot('/second/a', routes$).matched.cursor.fullPath).toBe('/second/a/2/');
    expect(renderRoot('/second/a/1', routes$).matched.cursor.fullPath).toBe('/second/a/1/');
    expect(renderRoot('/second/a/2', routes$).matched.cursor.fullPath).toBe('/second/a/2/');
    expect(renderRoot('/second/b', routes$).matched.cursor.fullPath).toBe('/third/');
    expect(renderRoot('/third/', routes$).matched.cursor.fullPath).toBe('/third/');
  });
});
