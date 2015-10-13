/*
 * jQuery OOP Class
 *
 * Inspired by the original Simple JavaScript Inheritance by John Resig (https://gist.github.com/Jonathonbyrd/724083)
 *
 * Copyright 2015 SARL ETD Solutions.
 * Licensed under MIT (https://github.com/etd-framework/jquery.class/blob/master/LICENSE)
 */

/**
 * Module representing a simple javascript inheritance.
 * @module Class
 */
define(["jquery"], function(jQuery) {

    (function(){

        var initializing = false,
            fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

        /**
         * Creates hooks
         *
         * @param {function} fn the function to listen to.
         *
         * @returns {hookableFunction}
         * @function
         */
        function hookable(fn) {

            var ifn = fn,
                hooks = {
                    before : [],
                    after : []
                };

            function hookableFunction() {
                var args = [].slice.call(arguments, 0),
                    i = 0,
                    fn;
                for (i = 0; !!hooks.before[i]; i += 1) {
                    fn = hooks.before[i];
                    fn.apply(this, args);
                }
                var r = ifn.apply(this, arguments);
                for (i = 0; !!hooks.after[i]; i++) {
                    fn = hooks.after[i];
                    fn.apply(this, args);
                }
                return r;
            }

            hookableFunction.bind = function (oThis) {

                if (typeof this !== "function") {
                    // closest thing possible to the ECMAScript 5 internal IsCallable function
                    throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
                }

                var aArgs = Array.prototype.slice.call(arguments, 1),
                    fToBind = this,
                    fNOP = function () {},
                    fBound = function () {
                        return fToBind.apply(this instanceof fNOP && oThis
                                ? this
                                : oThis,
                            aArgs.concat(Array.prototype.slice.call(arguments)));
                    };

                fNOP.prototype = this.prototype;
                fBound.prototype = new fNOP();

                return fBound;
            };

            hookableFunction.addHook = function (type, fn) {
                if (hooks[type] instanceof Array) {
                    hooks[type].push(fn);
                } else {
                    throw (function () {
                        var e = new Error("Invalid hook type");
                        e.expected = Object.keys(hooks);
                        e.got = type;
                        return e;
                    }());
                }
            };

            return hookableFunction;
        }

        /**
         * The base _Class implementation (does nothing)
         *
         * @private
         */
        this._Class = function(){};

        /**
         * Creates a new _Class that inherits from this _Class
         *
         * @param {object} prop The extened properties.
         *
         * @returns {_Class} The new _Class
         */
        _Class.extend = function(prop) {
            var _super = this.prototype;

            // Instantiate a base _Class (but only create the instance,
            // don't run the init constructor)
            initializing = true;
            var prototype = new this();
            initializing = false;

            // Copy the properties over onto the new prototype
            for (var name in prop) {
                // Check if we're overwriting an existing function
                prototype[name] =
                    typeof prop[name] == "function"
                    && typeof _super[name] == "function"
                    && fnTest.test(prop[name])
                        // this is how we override a function
                        ? (function(name, fn) {
                        return function() {
                            var tmp = this._super;

                            // Add a new ._super() method that is the same method
                            // but on the super-class
                            this._super = _super[name];

                            // The method only need to be bound temporarily, so we
                            // remove it when we're done executing
                            var ret = fn.apply(this, arguments);
                            this._super = tmp;

                            return ret;
                        };
                    })(name, prop[name])
                        // this is how we create a function
                        : (typeof prop[name] == 'function' ? hookable(prop[name])

                        // direct overload of a property
                        : (typeof prop[name] == 'object'
                    && typeof _super[name] == 'object'
                        // extend an object
                        ? jQuery.extend(true, _super[name], prop[name]) : prop[name]));
            }

            // The dummy class constructor
            function _Class() {
                // All construction is actually done in the init method
                if ( !initializing && this.init )
                    this.init.apply(this, arguments);
            }

            // Populate our constructed prototype object
            _Class.prototype = prototype;

            // Enforce the constructor to be what we expect
            _Class.constructor = _Class;

            // And make this class extendable
            _Class.extend = hookable(arguments.callee);

            return _Class;
        };

    })();

    /**
     * Returns unique class identifier
     *
     * @param {jQuery} $element The base element.
     *
     * @returns {String}
     * @private
     */
    function _uid($element) {
        if ($element.attr('id'))
            return $element.attr('id');

        if ($element.attr('name'))
            return $element.attr('name');

        var form = '';
        if ($element.context.form.id)
            form = $element.context.form.id;

        if (!form && $element.context.form.name)
            form = $element.context.form.name;

        return form + $element.index();
    }

    /**
     * The base Class
     *
     * @exports Class
     */
    var Class = _Class.extend({

        $element: null,

        defaults: {},
        options: {},

        /**
         * Constructor
         *
         * @param {jQuery|HTMLElement|String} element The base DOM element or string identifier.
         * @param {object|null}        options Optional options to set.
         *
         * @constructor
         * @alias module:Class
         */
        init: function(element, options) {
            this.$element = jQuery(element);
            if (options)
                this.setOptions(options);
        },

        /**
         * Sets the class options.
         *
         * @param {object} options An object containing the options.
         *
         * @returns {Class}
         */
        setOptions: function(options) {
            jQuery.extend(true, this.options, {}, this.defaults, options);
            return this;
        },

        /**
         * Sets a class option.
         *
         * @param {string} name  The option name.
         * @param {*}      value The option value.
         *
         * @returns {Class}
         */
        set: function(name, value) {
            this.options[name] = value;
            return this;
        },

        /**
         * Gets a class option.
         *
         * @param {string} name The option name.
         * @param {*}      def  The optional default value if option is undefined.
         *
         * @returns {*} The option value if defined, default value else.
         */
        get: function(name, def) {
            return typeof this.options[name] != 'undefined' ? this.options[name] : def;
        },

        /**
         * Gets the base jQuery wrapped DOM element
         *
         * @returns {jQuery}
         */
        getElement: function() {
            return this.$element;
        },

        /**
         * Gets the base DOM element
         *
         * @returns {HTMLElement}
         */
        getRawElement: function() {
            return this.element().context;
        },

        /**
         * Gets unique idenifier.
         *
         * @returns {string}
         */
        uid: function() {
            return _uid(this.getElement()).replace(/[/,'').replace(/]/,'').replace(/:/,'');
        }
    });

    return Class;

});
