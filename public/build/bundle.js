
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
    const { navigate } = globalHistory;

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    function shouldNavigate(event) {
      return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      );
    }

    function hostMatches(anchor) {
      const host = location.host;
      return (
        anchor.host == host ||
        // svelte seems to kill anchor.host value in ie11, so fall back to checking href
        anchor.href.indexOf(`https://${host}`) === 0 ||
        anchor.href.indexOf(`http://${host}`) === 0
      )
    }

    /* node_modules/svelte-routing/src/Router.svelte generated by Svelte v3.35.0 */

    function create_fragment$5(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let $routes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	component_subscribe($$self, routes, value => $$invalidate(7, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	component_subscribe($$self, location, value => $$invalidate(6, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	component_subscribe($$self, base, value => $$invalidate(5, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	$$self.$$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 32) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			{
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 192) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			{
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [
    		routes,
    		location,
    		base,
    		basepath,
    		url,
    		$base,
    		$location,
    		$routes,
    		$$scope,
    		slots
    	];
    }

    class Router extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { basepath: 3, url: 4 });
    	}
    }

    /* node_modules/svelte-routing/src/Route.svelte generated by Svelte v3.35.0 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 4,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[2],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, routeParams, $location*/ 532) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[2],
    		/*routeProps*/ ctx[3]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return { props: switch_instance_props };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 28)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 4 && get_spread_object(/*routeParams*/ ctx[2]),
    					dirty & /*routeProps*/ 8 && get_spread_object(/*routeProps*/ ctx[3])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[1] !== null && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[7] && create_if_block(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[1] !== null && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$activeRoute*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	component_subscribe($$self, activeRoute, value => $$invalidate(1, $activeRoute = value));
    	const location = getContext(LOCATION);
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 2) {
    			if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(2, routeParams = $activeRoute.params);
    			}
    		}

    		{
    			const { path, component, ...rest } = $$props;
    			$$invalidate(3, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		$activeRoute,
    		routeParams,
    		routeProps,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { path: 8, component: 0 });
    	}
    }

    /**
     * A link action that can be added to <a href=""> tags rather
     * than using the <Link> component.
     *
     * Example:
     * ```html
     * <a href="/post/{postId}" use:link>{post.title}</a>
     * ```
     */
    function link(node) {
      function onClick(event) {
        const anchor = event.currentTarget;

        if (
          anchor.target === "" &&
          hostMatches(anchor) &&
          shouldNavigate(event)
        ) {
          event.preventDefault();
          navigate(anchor.pathname + anchor.search, { replace: anchor.hasAttribute("replace") });
        }
      }

      node.addEventListener("click", onClick);

      return {
        destroy() {
          node.removeEventListener("click", onClick);
        }
      };
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }

    var _ = {
      $(selector) {
        if (typeof selector === "string") {
          return document.querySelector(selector);
        }
        return selector;
      },
      extend(...args) {
        return Object.assign(...args);
      },
      cumulativeOffset(element) {
        let top = 0;
        let left = 0;

        do {
          top += element.offsetTop || 0;
          left += element.offsetLeft || 0;
          element = element.offsetParent;
        } while (element);

        return {
          top: top,
          left: left
        };
      },
      directScroll(element) {
        return element && element !== document && element !== document.body;
      },
      scrollTop(element, value) {
        let inSetter = value !== undefined;
        if (this.directScroll(element)) {
          return inSetter ? (element.scrollTop = value) : element.scrollTop;
        } else {
          return inSetter
            ? (document.documentElement.scrollTop = document.body.scrollTop = value)
            : window.pageYOffset ||
                document.documentElement.scrollTop ||
                document.body.scrollTop ||
                0;
        }
      },
      scrollLeft(element, value) {
        let inSetter = value !== undefined;
        if (this.directScroll(element)) {
          return inSetter ? (element.scrollLeft = value) : element.scrollLeft;
        } else {
          return inSetter
            ? (document.documentElement.scrollLeft = document.body.scrollLeft = value)
            : window.pageXOffset ||
                document.documentElement.scrollLeft ||
                document.body.scrollLeft ||
                0;
        }
      }
    };

    const defaultOptions = {
      container: "body",
      duration: 500,
      delay: 0,
      offset: 0,
      easing: cubicInOut,
      onStart: noop,
      onDone: noop,
      onAborting: noop,
      scrollX: false,
      scrollY: true
    };

    const _scrollTo = options => {
      let {
        offset,
        duration,
        delay,
        easing,
        x=0,
        y=0,
        scrollX,
        scrollY,
        onStart,
        onDone,
        container,
        onAborting,
        element
      } = options;

      if (typeof offset === "function") {
        offset = offset();
      }

      var cumulativeOffsetContainer = _.cumulativeOffset(container);
      var cumulativeOffsetTarget = element
        ? _.cumulativeOffset(element)
        : { top: y, left: x };

      var initialX = _.scrollLeft(container);
      var initialY = _.scrollTop(container);

      var targetX =
        cumulativeOffsetTarget.left - cumulativeOffsetContainer.left + offset;
      var targetY =
        cumulativeOffsetTarget.top - cumulativeOffsetContainer.top + offset;

      var diffX = targetX - initialX;
    	var diffY = targetY - initialY;

      let scrolling = true;
      let started = false;
      let start_time = now() + delay;
      let end_time = start_time + duration;

      function scrollToTopLeft(element, top, left) {
        if (scrollX) _.scrollLeft(element, left);
        if (scrollY) _.scrollTop(element, top);
      }

      function start(delayStart) {
        if (!delayStart) {
          started = true;
          onStart(element, {x, y});
        }
      }

      function tick(progress) {
        scrollToTopLeft(
          container,
          initialY + diffY * progress,
          initialX + diffX * progress
        );
      }

      function stop() {
        scrolling = false;
      }

      loop(now => {
        if (!started && now >= start_time) {
          start(false);
        }

        if (started && now >= end_time) {
          tick(1);
          stop();
          onDone(element, {x, y});
        }

        if (!scrolling) {
          onAborting(element, {x, y});
          return false;
        }
        if (started) {
          const p = now - start_time;
          const t = 0 + 1 * easing(p / duration);
          tick(t);
        }

        return true;
      });

      start(delay);

      tick(0);

      return stop;
    };

    const proceedOptions = options => {
    	let opts = _.extend({}, defaultOptions, options);
      opts.container = _.$(opts.container);
      opts.element = _.$(opts.element);
      return opts;
    };

    const scrollTo = options => {
      return _scrollTo(proceedOptions(options));
    };

    /* src/components/Navbars/AuthNavbar.svelte generated by Svelte v3.35.0 */

    function create_fragment$3(ctx) {
    	let nav;
    	let div2;
    	let div0;
    	let a0;
    	let img;
    	let img_src_value;
    	let t0;
    	let button0;
    	let t1;
    	let div1;
    	let ul;
    	let li0;
    	let t4;
    	let li1;
    	let t7;
    	let li2;
    	let button1;
    	let div1_class_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			nav = element("nav");
    			div2 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			button0 = element("button");
    			button0.innerHTML = `<i class="text-white fas fa-bars"></i>`;
    			t1 = space();
    			div1 = element("div");
    			ul = element("ul");
    			li0 = element("li");

    			li0.innerHTML = `<a class="lg:text-white lg:hover:text-blueGray-200 text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold" href="https://twitter.com/tokenocean" target="_blank"><i class="lg:text-blueGray-200 text-blueGray-700 fab fa-twitter text-lg leading-lg"></i> 
            <span class="lg:hidden inline-block ml-2">Twitter</span></a>`;

    			t4 = space();
    			li1 = element("li");

    			li1.innerHTML = `<a class="lg:text-white lg:hover:text-blueGray-200 text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold" href="https://github.com/tokenocean" target="_blank"><i class="lg:text-blueGray-200 text-blueGray-700 fab fa-github text-lg leading-lg"></i> 
            <span class="lg:hidden inline-block ml-2">GitHub</span></a>`;

    			t7 = space();
    			li2 = element("li");
    			button1 = element("button");
    			button1.innerHTML = `<i class="fas fa-handshake mr-1"></i> Book a Consultation`;
    			if (img.src !== (img_src_value = logo)) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(img, "class", "w-32");
    			attr(a0, "class", "text-white text-sm font-bold leading-relaxed inline-block mr-4 py-2 whitespace-nowrap uppercase");
    			attr(a0, "href", "/");
    			attr(button0, "class", "cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none");
    			attr(button0, "type", "button");
    			attr(div0, "class", "w-full relative flex justify-between lg:w-auto lg:static lg:block lg:justify-start");
    			attr(li0, "class", "flex items-center");
    			attr(li1, "class", "flex items-center");
    			attr(button1, "class", "bg-blueGray-200 md:bg-white text-blueGray-700 active:bg-blueGray-50 text-xs font-bold uppercase px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none lg:mr-1 lg:mb-0 ml-3 mb-3 ease-linear transition-all duration-150");
    			attr(button1, "type", "button");
    			attr(li2, "class", "flex items-center");
    			attr(ul, "class", "flex flex-col lg:flex-row list-none lg:ml-auto");
    			attr(div1, "class", div1_class_value = "lg:flex flex-grow items-center bg-blueGray-200 lg:bg-opacity-0 lg:shadow-none rounded shadow-lg " + (/*navbarOpen*/ ctx[0] ? "block" : "hidden"));
    			attr(div1, "id", "example-navbar-warning");
    			attr(div2, "class", "container px-4 mx-auto flex flex-wrap items-center justify-between");
    			attr(nav, "class", "top-0 absolute z-50 w-full flex flex-wrap items-center justify-between px-2 py-3 navbar-expand-lg");
    		},
    		m(target, anchor) {
    			insert(target, nav, anchor);
    			append(nav, div2);
    			append(div2, div0);
    			append(div0, a0);
    			append(a0, img);
    			append(div0, t0);
    			append(div0, button0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div1, ul);
    			append(ul, li0);
    			append(ul, t4);
    			append(ul, li1);
    			append(ul, t7);
    			append(ul, li2);
    			append(li2, button1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a0)),
    					listen(button0, "click", /*setNavbarOpen*/ ctx[1]),
    					listen(button1, "click", /*click_handler*/ ctx[2])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*navbarOpen*/ 1 && div1_class_value !== (div1_class_value = "lg:flex flex-grow items-center bg-blueGray-200 lg:bg-opacity-0 lg:shadow-none rounded shadow-lg " + (/*navbarOpen*/ ctx[0] ? "block" : "hidden"))) {
    				attr(div1, "class", div1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(nav);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    const logo = "/assets/img/logo.png";

    function instance$3($$self, $$props, $$invalidate) {
    	let navbarOpen = false;

    	function setNavbarOpen() {
    		$$invalidate(0, navbarOpen = !navbarOpen);
    	}

    	const click_handler = () => scrollTo({ element: "#book" });
    	return [navbarOpen, setNavbarOpen, click_handler];
    }

    class AuthNavbar extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
    	}
    }

    /* src/components/Footers/Footer.svelte generated by Svelte v3.35.0 */

    function create_fragment$2(ctx) {
    	let footer;
    	let div0;
    	let t0;
    	let div10;
    	let div6;
    	let t10;
    	let hr;
    	let t11;
    	let div9;
    	let div8;
    	let div7;

    	return {
    		c() {
    			footer = element("footer");
    			div0 = element("div");
    			div0.innerHTML = `<svg class="absolute bottom-0 overflow-hidden" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0"><polygon class="text-blueGray-200 fill-current" points="2560 0 2560 100 0 100"></polygon></svg>`;
    			t0 = space();
    			div10 = element("div");
    			div6 = element("div");

    			div6.innerHTML = `<div class="w-full lg:w-6/12 px-4"><div class="mt-6 lg:mb-0 mb-6"><a href="https://twitter.com/tokenocean" target="_blank" rel="noreferrer"><button class="bg-white text-lightBlue-400 shadow-lg font-normal h-10 w-10 items-center justify-center align-center rounded-full outline-none focus:outline-none mr-2" type="button"><i class="fab fa-twitter"></i></button></a> 
          <a href="https://github.com/tokenocean" target="_blank" rel="noreferrer"><button class="bg-white text-blueGray-800 shadow-lg font-normal h-10 w-10 items-center justify-center align-center rounded-full outline-none focus:outline-none mr-2" type="button"><i class="fab fa-github"></i></button></a></div></div> 
      <div class="w-full lg:w-6/12 px-4"><div class="flex flex-wrap items-top mb-6"><div class="w-full lg:w-4/12 px-4 ml-auto"><span class="block uppercase text-blueGray-500 text-sm font-semibold mb-2">Useful Links</span> 
            <ul class="list-unstyled"><li><a class="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm" href="https://bitcoin.org">Bitcoin</a></li> 
              <li><a class="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm" href="https://blockstream.com/liquid/">Liquid Network</a></li> 
              <li><a class="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm" href="https://wikiless.org/wiki/Non-fungible_token">NFT&#39;s</a></li></ul></div></div></div>`;

    			t10 = space();
    			hr = element("hr");
    			t11 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div7.textContent = `Copyright © ${/*date*/ ctx[0]} Token Ocean`;
    			attr(div0, "class", "bottom-auto top-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20 h-20");
    			set_style(div0, "transform", "translateZ(0)");
    			attr(div6, "class", "flex flex-wrap text-center lg:text-left");
    			attr(hr, "class", "my-6 border-blueGray-300");
    			attr(div7, "class", "text-sm text-blueGray-500 font-semibold py-1");
    			attr(div8, "class", "w-full md:w-4/12 px-4 mx-auto text-center");
    			attr(div9, "class", "flex flex-wrap items-center md:justify-between justify-center");
    			attr(div10, "class", "container mx-auto px-4");
    			attr(footer, "class", "relative bg-blueGray-200 pt-8 pb-6");
    		},
    		m(target, anchor) {
    			insert(target, footer, anchor);
    			append(footer, div0);
    			append(footer, t0);
    			append(footer, div10);
    			append(div10, div6);
    			append(div10, t10);
    			append(div10, hr);
    			append(div10, t11);
    			append(div10, div9);
    			append(div9, div8);
    			append(div8, div7);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(footer);
    		}
    	};
    }

    function instance$2($$self) {
    	let date = new Date().getFullYear();
    	return [date];
    }

    class Footer extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
    	}
    }

    /* src/views/Index.svelte generated by Svelte v3.35.0 */

    function create_fragment$1(ctx) {
    	let div79;
    	let authnavbar;
    	let t0;
    	let main;
    	let div6;
    	let div0;
    	let span0;
    	let t1;
    	let div4;
    	let t11;
    	let div5;
    	let t12;
    	let section0;
    	let div25;
    	let div19;
    	let t27;
    	let div24;
    	let div21;
    	let t32;
    	let div23;
    	let div22;
    	let img0;
    	let img0_src_value;
    	let t33;
    	let blockquote;
    	let t43;
    	let section1;
    	let div26;
    	let t44;
    	let div41;
    	let div40;
    	let div27;
    	let img1;
    	let img1_src_value;
    	let t45;
    	let div39;
    	let t59;
    	let section2;
    	let h20;
    	let t61;
    	let div43;
    	let div42;
    	let img2;
    	let img2_src_value;
    	let t62;
    	let img3;
    	let img3_src_value;
    	let t63;
    	let img4;
    	let img4_src_value;
    	let t64;
    	let img5;
    	let img5_src_value;
    	let t65;
    	let img6;
    	let img6_src_value;
    	let t66;
    	let section3;
    	let div55;
    	let div45;
    	let t70;
    	let div54;
    	let div49;
    	let div48;
    	let img7;
    	let img7_src_value;
    	let t71;
    	let div47;
    	let t77;
    	let div53;
    	let div52;
    	let img8;
    	let img8_src_value;
    	let t78;
    	let div51;
    	let t84;
    	let section4;
    	let t104;
    	let section5;
    	let div78;
    	let div77;
    	let div76;
    	let div75;
    	let div74;
    	let h44;
    	let t106;
    	let p13;
    	let t108;
    	let div67;
    	let t111;
    	let div68;
    	let t114;
    	let div69;
    	let t117;
    	let div70;
    	let t120;
    	let div71;
    	let label4;
    	let t122;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let t128;
    	let div72;
    	let t131;
    	let div73;
    	let t133;
    	let footer;
    	let current;
    	authnavbar = new AuthNavbar({});
    	footer = new Footer({});

    	return {
    		c() {
    			div79 = element("div");
    			create_component(authnavbar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div6 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t1 = space();
    			div4 = element("div");

    			div4.innerHTML = `<div class="items-center flex flex-wrap"><div class="w-full lg:w-6/12 px-4 ml-auto mr-auto text-center"><div class="md:pr-12"><h1 class="text-white font-semibold text-5xl">We Make it Easy For Brands to Leverage NFT’s.</h1> 
              <p class="mt-4 text-lg text-blueGray-200">We are a <span class="text-brightgreen">white label</span>
                provider of <span class="text-brightgreen">bitcoin</span> based
                <span class="text-brightgreen">NFT marketplaces</span>. Book a
                consultation with us to learn how you can leverage NFT’s for
                your business.</p></div></div></div>`;

    			t11 = space();
    			div5 = element("div");
    			div5.innerHTML = `<svg class="absolute bottom-0 overflow-hidden" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0"><polygon class="text-blueGray-200 fill-current" points="2560 0 2560 100 0 100"></polygon></svg>`;
    			t12 = space();
    			section0 = element("section");
    			div25 = element("div");
    			div19 = element("div");

    			div19.innerHTML = `<div class="lg:pt-12 pt-6 w-full md:w-4/12 px-4 text-center"><div class="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg"><div class="px-4 py-5 flex-auto"><div class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-secondary"><i class="fab fa-bitcoin"></i></div> 
                <h6 class="text-xl font-semibold">Bitcoin Only</h6> 
                <p class="mt-2 mb-4 text-blueGray-500">We leverage the Liquid Network, a bitcoin layer 2 solution to
                  utilize the world&#39;s leading and original decentralized
                  blockchain.</p></div></div></div> 

          <div class="w-full md:w-4/12 px-4 text-center"><div class="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg"><div class="px-4 py-5 flex-auto"><div class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-secondary"><i class="fas fa-toolbox"></i></div> 
                <h6 class="text-xl font-semibold">White Label Service</h6> 
                <p class="mt-2 mb-4 text-blueGray-500">We offer a full suite of services making it possible to
                  realize your vision and provide ongoing maintenance if
                  requested.</p></div></div></div> 

          <div class="pt-6 w-full md:w-4/12 px-4 text-center"><div class="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg"><div class="px-4 py-5 flex-auto"><div class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-secondary"><i class="fas fa-chalkboard-teacher"></i></div> 
                <h6 class="text-xl font-semibold">Decades of Experience</h6> 
                <p class="mt-2 mb-4 text-blueGray-500">Our team are experts in privacy, security, development, and
                  distributed networks.</p></div></div></div>`;

    			t27 = space();
    			div24 = element("div");
    			div21 = element("div");

    			div21.innerHTML = `<div class="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-white"><i class="fas fa-user-friends text-xl"></i></div> 
            <h3 class="text-3xl mb-2 font-semibold leading-normal">Your Own Marketplace</h3> 
            <p class="text-lg font-light leading-relaxed mt-4 mb-4 text-blueGray-600">Control your own brand and destiny and leverage your current
              online presence.</p>`;

    			t32 = space();
    			div23 = element("div");
    			div22 = element("div");
    			img0 = element("img");
    			t33 = space();
    			blockquote = element("blockquote");

    			blockquote.innerHTML = `<ul class="text-md leading-relaxed text-white list-disc custom"><h4 class="mb-3 text-xl font-bold text-white">Features</h4> 
                  <li>Royalty distribution</li> 
                  <li>An entirely new marketing campaign opportunity</li> 
                  <li>Secondary market opportunities</li> 
                  <li>Special access, community, DAO, memberships</li></ul>`;

    			t43 = space();
    			section1 = element("section");
    			div26 = element("div");
    			div26.innerHTML = `<svg class="absolute bottom-0 overflow-hidden" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0"><polygon class="text-white fill-current" points="2560 0 2560 100 0 100"></polygon></svg>`;
    			t44 = space();
    			div41 = element("div");
    			div40 = element("div");
    			div27 = element("div");
    			img1 = element("img");
    			t45 = space();
    			div39 = element("div");

    			div39.innerHTML = `<div class="md:pr-12"><div class="text-black p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-brightgreen"><i class="fas fa-laptop text-xl"></i></div> 
              <h3 class="text-3xl font-semibold">Hassle Free Tech</h3> 
              <p class="mt-4 text-lg leading-relaxed text-blueGray-500">We make sure your systems stay up and running so you don&#39;t have
                to.</p> 
              <ul class="list-none mt-6"><li class="py-2"><div class="flex items-center"><div><span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-black bg-brightgreen mr-3"><i class="fas fa-brain"></i></span></div> 
                    <div><h4 class="text-blueGray-500">You benefit from our knowledge of the bitcoin and NFT
                        industries</h4></div></div></li> 
                <li class="py-2"><div class="flex items-center"><div><span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-black bg-brightgreen mr-3"><i class="far fa-paper-plane"></i></span></div> 
                    <div><h4 class="text-blueGray-500">Full-phase project implementation and maintenance</h4></div></div></li> 
                <li class="py-2"><div class="flex items-center"><div><span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-black bg-brightgreen mr-3"><i class="fab fa-js-square"></i></span></div> 
                    <div><h4 class="text-blueGray-500">Expertise in design, development, deployment and scaling</h4></div></div></li></ul></div>`;

    			t59 = space();
    			section2 = element("section");
    			h20 = element("h2");
    			h20.textContent = "Companies we have worked with";
    			t61 = space();
    			div43 = element("div");
    			div42 = element("div");
    			img2 = element("img");
    			t62 = space();
    			img3 = element("img");
    			t63 = space();
    			img4 = element("img");
    			t64 = space();
    			img5 = element("img");
    			t65 = space();
    			img6 = element("img");
    			t66 = space();
    			section3 = element("section");
    			div55 = element("div");
    			div45 = element("div");

    			div45.innerHTML = `<div class="w-full lg:w-6/12 px-4"><h2 class="text-4xl font-semibold">About Us</h2> 
            <p class="text-lg leading-relaxed m-4 text-blueGray-500">Kris Constable and Adam Soltys - the co-founders of tokenocean.io,
              co-founded the first bitcoin-based white label NFT marketplace in
              the world by using the Liquid Network. Way ahead of their time,
              they are working with billion dollar brands building their NFT
              marketplaces, and have scaled their stack to work for smaller
              influencers and entrepreneurs alike to build the use-cases that
              will be ubiquitous in our collective future.</p></div>`;

    			t70 = space();
    			div54 = element("div");
    			div49 = element("div");
    			div48 = element("div");
    			img7 = element("img");
    			t71 = space();
    			div47 = element("div");

    			div47.innerHTML = `<h5 class="text-xl font-bold">Kris Constable</h5> 
                <p class="mt-1 text-sm text-blueGray-400 uppercase font-semibold">CEO</p> 
                <div class="mt-6"><a href="https://twitter.com/cqwww" target="_blank" rel="noreferrer"><button class="bg-lightBlue-400 text-white w-8 h-8 rounded-full outline-none focus:outline-none mr-1 mb-1" type="button"><i class="fab fa-twitter"></i></button></a> 
                  <a href="https://github.com/improvethings" target="_blank" rel="noreferrer"><button class="bg-gray-600 text-white w-8 h-8 rounded-full outline-none focus:outline-none mr-1 mb-1" type="button"><i class="fab fa-github"></i></button></a></div>`;

    			t77 = space();
    			div53 = element("div");
    			div52 = element("div");
    			img8 = element("img");
    			t78 = space();
    			div51 = element("div");

    			div51.innerHTML = `<h5 class="text-xl font-bold">Adam Soltys</h5> 
                <p class="mt-1 text-sm text-blueGray-400 uppercase font-semibold">CTO</p> 
                <div class="mt-6"><button class="bg-lightBlue-400 text-white w-8 h-8 rounded-full outline-none focus:outline-none mr-1 mb-1" type="button"><a href="https://twitter.com/adamsoltys" target="_blank" rel="noreferrer"><i class="fab fa-twitter"></i></a></button> 
                  <button class="bg-gray-600 text-white w-8 h-8 rounded-full outline-none focus:outline-none mr-1 mb-1" type="button"><a href="https://github.com/asoltys" target="_blank" rel="noreferrer"><i class="fab fa-github"></i></a></button></div>`;

    			t84 = space();
    			section4 = element("section");

    			section4.innerHTML = `<div class="bottom-auto top-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20 h-20" style="transform: translateZ(0);"><svg class="absolute bottom-0 overflow-hidden" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0"><polygon class="text-blueGray-800 fill-current" points="2560 0 2560 100 0 100"></polygon></svg></div> 

      <div class="container mx-auto px-4 pt-24 lg:pb-64"><div class="flex flex-wrap text-center justify-center"><div class="w-full lg:w-6/12 px-4"><h2 class="text-4xl font-semibold text-white">Let&#39;s build something!</h2> 
            <p class="text-lg leading-relaxed mt-4 mb-4 text-blueGray-400">We have built many NFT marketplaces covering a wide variety of
              use-cases and yours could be our next project.</p></div></div> 
        <div class="flex flex-wrap mt-12 justify-center"><div class="w-full lg:w-3/12 px-4 text-center"><div class="text-blueGray-800 p-3 w-12 h-12 shadow-lg rounded-full bg-brightgreen inline-flex items-center justify-center"><i class="fas fa-dollar-sign text-xl"></i></div> 
            <h6 class="text-xl mt-5 font-semibold text-white">Low cost transactions</h6> 
            <p class="mt-2 mb-4 text-blueGray-400">No gas fees! Cost for users to mint on your marketplace is only 50
              sats (about 3 cents).</p></div> 
          <div class="w-full lg:w-3/12 px-4 text-center"><div class="text-blueGray-800 p-3 w-12 h-12 shadow-lg rounded-full bg-brightgreen inline-flex items-center justify-center"><i class="fas fa-coins text-xl"></i></div> 
            <h5 class="text-xl mt-5 font-semibold text-white">Any physical or digital asset can be made an NFT</h5> 
            <p class="mt-2 mb-4 text-blueGray-400">The novel invention of digital scarcity means you can tokenize
              anything.</p></div> 
          <div class="w-full lg:w-3/12 px-4 text-center"><div class="text-blueGray-800 p-3 w-12 h-12 shadow-lg rounded-full bg-brightgreen inline-flex items-center justify-center"><i class="fas fa-hands-helping text-xl"></i></div> 
            <h5 class="text-xl mt-5 font-semibold text-white">We&#39;re here to help</h5> 
            <p class="mt-2 mb-20 text-blueGray-400">We iterate with you to create the best possible product.</p></div></div></div>`;

    			t104 = space();
    			section5 = element("section");
    			div78 = element("div");
    			div77 = element("div");
    			div76 = element("div");
    			div75 = element("div");
    			div74 = element("div");
    			h44 = element("h4");
    			h44.textContent = "Book a consultation";
    			t106 = space();
    			p13 = element("p");
    			p13.textContent = "We're excited to work with you! Please describe briefly your\n                  bitcoin NFT idea or project so we may provide a specific and\n                  timely reply to your inquiry.";
    			t108 = space();
    			div67 = element("div");

    			div67.innerHTML = `<label class="block uppercase text-blueGray-600 text-xs font-bold mb-2" for="full-name">Name *</label> 
                  <input id="full-name" type="text" class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150" placeholder="Full Name"/>`;

    			t111 = space();
    			div68 = element("div");

    			div68.innerHTML = `<label class="block uppercase text-blueGray-600 text-xs font-bold mb-2" for="email">Email *</label> 
                  <input id="email" type="email" class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150" placeholder="Email Address"/>`;

    			t114 = space();
    			div69 = element("div");

    			div69.innerHTML = `<label class="block uppercase text-blueGray-600 text-xs font-bold mb-2" for="phone">Phone</label> 
                  <input id="phone" type="phone" class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150" placeholder="Phone Number"/>`;

    			t117 = space();
    			div70 = element("div");

    			div70.innerHTML = `<label class="block uppercase text-blueGray-600 text-xs font-bold mb-2" for="company">Company</label> 
                  <input id="company" type="company" class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150" placeholder="Company Name"/>`;

    			t120 = space();
    			div71 = element("div");
    			label4 = element("label");
    			label4.textContent = "Approximate Annual Revenue *";
    			t122 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Under $100,000";
    			option1 = element("option");
    			option1.textContent = "$100,000 - $500,000";
    			option2 = element("option");
    			option2.textContent = "$500,000 - $1,000,000";
    			option3 = element("option");
    			option3.textContent = "$1m - $10m";
    			option4 = element("option");
    			option4.textContent = "$10m +";
    			t128 = space();
    			div72 = element("div");

    			div72.innerHTML = `<label class="block uppercase text-blueGray-600 text-xs font-bold mb-2" for="message">Message *</label> 
                  <textarea id="message" rows="4" cols="80" class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full" placeholder="Type a message..."></textarea>`;

    			t131 = space();
    			div73 = element("div");
    			div73.innerHTML = `<button class="bg-secondary text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150" type="button">Send Message</button>`;
    			t133 = space();
    			create_component(footer.$$.fragment);
    			attr(span0, "id", "blackOverlay");
    			attr(span0, "class", "w-full h-full absolute opacity-50 bg-black");
    			attr(div0, "class", "absolute top-0 w-full h-full bg-center bg-cover");
    			set_style(div0, "background-image", "url(" + ocean + ")");
    			attr(div4, "class", "container relative mx-auto");
    			attr(div5, "class", "top-auto bottom-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden h-70-px");
    			set_style(div5, "transform", "translateZ(0)");
    			attr(div6, "class", "relative pt-16 pb-32 flex content-center items-center justify-center min-h-screen-75");
    			attr(div19, "class", "flex flex-wrap");
    			attr(div21, "class", "w-full md:w-5/12 px-4 mr-auto ml-auto");
    			attr(img0, "alt", "...");
    			if (img0.src !== (img0_src_value = raretoshi)) attr(img0, "src", img0_src_value);
    			attr(img0, "class", "w-full align-middle rounded-t-lg");
    			attr(blockquote, "class", "relative px-8 py-4 mb-4");
    			attr(div22, "class", "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-secondary");
    			attr(div23, "class", "w-full md:w-1/2 lg:w-4/12 px-4 mr-auto ml-auto");
    			attr(div24, "class", "flex flex-wrap items-center mt-16 md:mt-32");
    			attr(div25, "class", "container mx-auto px-4");
    			attr(section0, "class", "pb-20 bg-blueGray-200 -mt-24");
    			attr(div26, "class", "bottom-auto top-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20 h-20");
    			set_style(div26, "transform", "translateZ(0)");
    			attr(img1, "alt", "...");
    			attr(img1, "class", "max-w-full rounded-lg shadow-lg");
    			if (img1.src !== (img1_src_value = server)) attr(img1, "src", img1_src_value);
    			attr(div27, "class", "w-full md:w-1/2 lg:w-4/12 ml-auto mr-auto px-4");
    			attr(div39, "class", "mt-10 md:mt-0 w-full md:w-5/12 ml-auto mr-auto px-4");
    			attr(div40, "class", "items-center flex flex-wrap");
    			attr(div41, "class", "container mx-auto px-4");
    			attr(section1, "class", "relative py-20");
    			attr(h20, "class", "text-4xl font-semibold text-center mb-10 text-blueGray-500");
    			if (img2.src !== (img2_src_value = rare)) attr(img2, "src", img2_src_value);
    			attr(img2, "alt", "");
    			attr(img2, "class", "mx-auto");
    			if (img3.src !== (img3_src_value = playboy)) attr(img3, "src", img3_src_value);
    			attr(img3, "alt", "");
    			attr(img3, "class", "mx-auto");
    			if (img4.src !== (img4_src_value = silo)) attr(img4, "src", img4_src_value);
    			attr(img4, "alt", "");
    			attr(img4, "class", "mx-auto");
    			if (img5.src !== (img5_src_value = nftglee)) attr(img5, "src", img5_src_value);
    			attr(img5, "alt", "");
    			attr(img5, "class", "mx-auto");
    			if (img6.src !== (img6_src_value = blockstream)) attr(img6, "src", img6_src_value);
    			attr(img6, "alt", "");
    			attr(img6, "class", "mx-auto");
    			attr(div42, "class", "block md:flex justify-center items-center space-y-10 px-4 md:space-y-0 md:space-x-10");
    			attr(div43, "class", "flex justify-center items-center");
    			attr(section2, "class", "customborder border-y-8 border-offblack bg-primary py-32");
    			attr(div45, "class", "flex flex-wrap justify-center text-center mb-24");
    			attr(img7, "alt", "...");
    			if (img7.src !== (img7_src_value = kris)) attr(img7, "src", img7_src_value);
    			attr(img7, "class", "shadow-lg rounded-full mx-auto max-w-120-px");
    			attr(div47, "class", "pt-6 text-center");
    			attr(div48, "class", "px-6");
    			attr(div49, "class", "w-full md:w-6/12 lg:w-3/12 lg:mb-0 mb-12 px-4");
    			attr(img8, "alt", "...");
    			if (img8.src !== (img8_src_value = adam)) attr(img8, "src", img8_src_value);
    			attr(img8, "class", "shadow-lg rounded-full mx-auto max-w-120-px");
    			attr(div51, "class", "pt-6 text-center");
    			attr(div52, "class", "px-6");
    			attr(div53, "class", "w-full md:w-6/12 lg:w-3/12 lg:mb-0 mb-12 px-4");
    			attr(div54, "class", "flex justify-center items-center flex-wrap");
    			attr(div55, "class", "container mx-auto px-4");
    			attr(section3, "class", "pt-20 pb-20 md:pb-48");
    			attr(section4, "class", "pb-20 relative block bg-blueGray-800");
    			attr(h44, "class", "text-2xl font-semibold");
    			attr(p13, "class", "leading-relaxed mt-1 mb-4 text-blueGray-500");
    			attr(div67, "class", "relative w-full mb-3 mt-8");
    			attr(div68, "class", "relative w-full mb-3");
    			attr(div69, "class", "relative w-full mb-3");
    			attr(div70, "class", "relative w-full mb-3");
    			attr(label4, "class", "block uppercase text-blueGray-600 text-xs font-bold mb-2");
    			attr(label4, "for", "revenue");
    			option0.__value = "-100000";
    			option0.value = option0.__value;
    			option1.__value = "100000-500000";
    			option1.value = option1.__value;
    			option2.__value = "500000-1000000";
    			option2.value = option2.__value;
    			option3.__value = "1m-10m";
    			option3.value = option3.__value;
    			option4.__value = "10m+";
    			option4.value = option4.__value;
    			attr(select, "id", "revenue");
    			attr(select, "type", "revenue");
    			attr(select, "class", "border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150");
    			attr(div71, "class", "relative w-full mb-3");
    			attr(div72, "class", "relative w-full mb-3");
    			attr(div73, "class", "text-center mt-6");
    			attr(div74, "class", "flex-auto p-5 lg:p-10");
    			attr(div74, "id", "book");
    			attr(div75, "class", "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200");
    			attr(div76, "class", "w-full lg:w-6/12 px-4");
    			attr(div77, "class", "flex flex-wrap justify-center lg:-mt-64 -mt-48");
    			attr(div78, "class", "container mx-auto px-4");
    			attr(section5, "class", "relative block py-24 bg-primary");
    		},
    		m(target, anchor) {
    			insert(target, div79, anchor);
    			mount_component(authnavbar, div79, null);
    			append(div79, t0);
    			append(div79, main);
    			append(main, div6);
    			append(div6, div0);
    			append(div0, span0);
    			append(div6, t1);
    			append(div6, div4);
    			append(div6, t11);
    			append(div6, div5);
    			append(main, t12);
    			append(main, section0);
    			append(section0, div25);
    			append(div25, div19);
    			append(div25, t27);
    			append(div25, div24);
    			append(div24, div21);
    			append(div24, t32);
    			append(div24, div23);
    			append(div23, div22);
    			append(div22, img0);
    			append(div22, t33);
    			append(div22, blockquote);
    			append(main, t43);
    			append(main, section1);
    			append(section1, div26);
    			append(section1, t44);
    			append(section1, div41);
    			append(div41, div40);
    			append(div40, div27);
    			append(div27, img1);
    			append(div40, t45);
    			append(div40, div39);
    			append(main, t59);
    			append(main, section2);
    			append(section2, h20);
    			append(section2, t61);
    			append(section2, div43);
    			append(div43, div42);
    			append(div42, img2);
    			append(div42, t62);
    			append(div42, img3);
    			append(div42, t63);
    			append(div42, img4);
    			append(div42, t64);
    			append(div42, img5);
    			append(div42, t65);
    			append(div42, img6);
    			append(main, t66);
    			append(main, section3);
    			append(section3, div55);
    			append(div55, div45);
    			append(div55, t70);
    			append(div55, div54);
    			append(div54, div49);
    			append(div49, div48);
    			append(div48, img7);
    			append(div48, t71);
    			append(div48, div47);
    			append(div54, t77);
    			append(div54, div53);
    			append(div53, div52);
    			append(div52, img8);
    			append(div52, t78);
    			append(div52, div51);
    			append(main, t84);
    			append(main, section4);
    			append(main, t104);
    			append(main, section5);
    			append(section5, div78);
    			append(div78, div77);
    			append(div77, div76);
    			append(div76, div75);
    			append(div75, div74);
    			append(div74, h44);
    			append(div74, t106);
    			append(div74, p13);
    			append(div74, t108);
    			append(div74, div67);
    			append(div74, t111);
    			append(div74, div68);
    			append(div74, t114);
    			append(div74, div69);
    			append(div74, t117);
    			append(div74, div70);
    			append(div74, t120);
    			append(div74, div71);
    			append(div71, label4);
    			append(div71, t122);
    			append(div71, select);
    			append(select, option0);
    			append(select, option1);
    			append(select, option2);
    			append(select, option3);
    			append(select, option4);
    			append(div74, t128);
    			append(div74, div72);
    			append(div74, t131);
    			append(div74, div73);
    			append(div79, t133);
    			mount_component(footer, div79, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(authnavbar.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(authnavbar.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div79);
    			destroy_component(authnavbar);
    			destroy_component(footer);
    		}
    	};
    }

    const raretoshi = "/assets/img/raretoshi.png";
    const rare = "/assets/img/rare.png";
    const playboy = "/assets/img/playboy.png";
    const silo = "/assets/img/silo.png";
    const nftglee = "/assets/img/nftglee.png";
    const blockstream = "/assets/img/blockstream.png";
    const server = "/assets/img/server.jpg";
    const kris = "/assets/img/kris.jpg";
    const adam = "/assets/img/adam.jpg";
    const ocean = "/assets/img/ocean.jpg";

    function instance$1($$self, $$props, $$invalidate) {
    	let { location } = $$props;

    	$$self.$$set = $$props => {
    		if ("location" in $$props) $$invalidate(0, location = $$props.location);
    	};

    	return [location];
    }

    class Index extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { location: 0 });
    	}
    }

    /* src/App.svelte generated by Svelte v3.35.0 */

    function create_default_slot(ctx) {
    	let route;
    	let current;
    	route = new Route({ props: { path: "/", component: Index } });

    	return {
    		c() {
    			create_component(route.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(route, detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				url: /*url*/ ctx[0],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(router.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const router_changes = {};
    			if (dirty & /*url*/ 1) router_changes.url = /*url*/ ctx[0];

    			if (dirty & /*$$scope*/ 2) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(router, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { url = "" } = $$props;

    	$$self.$$set = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    	};

    	return [url];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, { url: 0 });
    	}
    }

    const app = new App({
      target: document.getElementById("app"),
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
